import { cityCatalog } from '../data/cities.js'

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter'
const DEFAULT_CONTEXT_RADIUS_METERS = 1800
const MIN_CONTEXT_RADIUS_METERS = 1000
const MAX_CONTEXT_RADIUS_METERS = 5000

const populationCatalog = {
    'new-delhi': 32900000,
    mumbai: 21700000,
    bengaluru: 13100000,
    kolkata: 15200000,
    chennai: 11500000,
    guwahati: 1200000,
    jaipur: 4200000,
    'new-york': 19700000,
    london: 9500000,
    singapore: 5900000,
    tokyo: 37200000,
    sydney: 5400000,
    nairobi: 5200000,
}

const taxCatalog = {
    india: {
        systemType: 'Municipal property tax + GST model',
        note: 'Property taxation is city-municipal and assessment-based; commercial activity also falls under GST slabs and local trade licensing.',
    },
    'united states': {
        systemType: 'Property tax + sales tax model',
        note: 'Cities rely heavily on property tax assessments, supplemented by state/local sales taxes and business permits.',
    },
    'united kingdom': {
        systemType: 'Council tax + business rates',
        note: 'Residential council tax and non-domestic business rates are core local revenue instruments.',
    },
    singapore: {
        systemType: 'Property tax + GST model',
        note: 'Annual value-based property tax with national GST and sector-specific license requirements.',
    },
    japan: {
        systemType: 'Fixed asset tax + city planning tax',
        note: 'Municipal fixed asset tax applies to land/buildings; urban areas can include city planning tax add-ons.',
    },
    australia: {
        systemType: 'Council rates + GST framework',
        note: 'Local councils levy rates while commercial operations align with GST and local permits.',
    },
    kenya: {
        systemType: 'Land rates + county levies',
        note: 'County governments collect land rates and business permit fees with national VAT framework.',
    },
    default: {
        systemType: 'Local property and commercial tax framework',
        note: 'Tax and commercial zoning details vary by jurisdiction; validate with municipal finance and planning portals.',
    },
}

function getTaxContext(country) {
    const key = String(country ?? '').trim().toLowerCase()

    if (key === 'india') {
        return taxCatalog.india
    }

    return taxCatalog[key] ?? taxCatalog.default
}

function summarizeInsights(payload) {
    const insights = []

    if (payload.populationEstimate) {
        insights.push(
            `Estimated metro population is ~${new Intl.NumberFormat('en-IN').format(payload.populationEstimate)}.`,
        )
    }

    if (payload.buildingEstimate !== null) {
        insights.push(
            `About ${payload.buildingEstimate} mapped buildings are found within ~${(payload.radiusMeters / 1000).toFixed(1)} km around ${payload.scopeLabel} (OSM proxy).`,
        )
    }

    if (payload.commercialPlaceCount !== null) {
        insights.push(
            `${payload.commercialPlaceCount} mapped commercial/amenity points detected around the selected ${payload.scope}.`,
        )
    }

    if (payload.scope === 'district') {
        insights.push(
            'District scope narrows the scan to a local planning footprint and can differ materially from city-core trends.',
        )
    }

    return insights
}

function normalizeRadiusMeters(input) {
    const value = Number(input)

    if (!Number.isFinite(value)) {
        return DEFAULT_CONTEXT_RADIUS_METERS
    }

    return Math.max(MIN_CONTEXT_RADIUS_METERS, Math.min(MAX_CONTEXT_RADIUS_METERS, Math.round(value)))
}

function overpassQuery(latitude, longitude, radiusMeters) {
    return `[out:json][timeout:25];
(
  way["building"](around:${radiusMeters},${latitude},${longitude});
  relation["building"](around:${radiusMeters},${latitude},${longitude});
);
out ids;
(
  node["shop"](around:${radiusMeters},${latitude},${longitude});
  node["amenity"~"restaurant|cafe|hospital|school|bank|pharmacy|mall|marketplace|cinema|fuel"](around:${radiusMeters},${latitude},${longitude});
  node["office"](around:${radiusMeters},${latitude},${longitude});
);
out tags;`
}

function tallyCommercialBreakdown(elements) {
    const breakdown = {
        shop: 0,
        food: 0,
        healthcare: 0,
        education: 0,
        finance: 0,
        office: 0,
        mobility: 0,
        other: 0,
    }

    for (const element of elements) {
        const tags = element?.tags ?? {}

        if (tags.shop) {
            breakdown.shop += 1
            continue
        }

        if (tags.office) {
            breakdown.office += 1
            continue
        }

        if (['restaurant', 'cafe', 'mall', 'marketplace', 'cinema'].includes(tags.amenity)) {
            breakdown.food += 1
            continue
        }

        if (['hospital', 'pharmacy'].includes(tags.amenity)) {
            breakdown.healthcare += 1
            continue
        }

        if (tags.amenity === 'school') {
            breakdown.education += 1
            continue
        }

        if (tags.amenity === 'bank') {
            breakdown.finance += 1
            continue
        }

        if (tags.amenity === 'fuel') {
            breakdown.mobility += 1
            continue
        }

        breakdown.other += 1
    }

    return breakdown
}

async function fetchOsmContext(latitude, longitude, radiusMeters) {
    const query = overpassQuery(latitude, longitude, radiusMeters)

    const response = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: new URLSearchParams({ data: query }),
    })

    if (!response.ok) {
        throw new Error('OSM context fetch failed')
    }

    const payload = await response.json()
    const elements = Array.isArray(payload?.elements) ? payload.elements : []

    const buildingEstimate = elements.filter(
        (element) => element?.type === 'way' || element?.type === 'relation',
    ).length

    const commercialElements = elements.filter((element) => element?.type === 'node')
    const commercialBreakdown = tallyCommercialBreakdown(commercialElements)

    return {
        dataSource: 'live-osm',
        buildingEstimate,
        commercialPlaceCount: commercialElements.length,
        commercialBreakdown,
    }
}

function fallbackContext() {
    return {
        dataSource: 'catalog-fallback',
        buildingEstimate: null,
        commercialPlaceCount: null,
        commercialBreakdown: {},
    }
}

export async function getCityContextDetails(cityId, options = {}) {
    const city = cityCatalog[cityId]

    if (!city) {
        throw new Error('Unknown city')
    }

    const radiusMeters = normalizeRadiusMeters(options.radiusMeters)
    const latitude = typeof options.latitude === 'number' ? options.latitude : city.latitude
    const longitude = typeof options.longitude === 'number' ? options.longitude : city.longitude
    const scope = options.scope === 'district' ? 'district' : 'city'
    const scopeLabel =
        typeof options.scopeLabel === 'string' && options.scopeLabel.trim()
            ? options.scopeLabel.trim()
            : scope === 'district'
                ? `${city.name} district`
                : `${city.name} city core`

    let dynamicContext

    try {
        dynamicContext = await fetchOsmContext(latitude, longitude, radiusMeters)
    } catch {
        dynamicContext = fallbackContext()
    }

    const context = {
        cityId: city.id,
        cityName: city.name,
        country: city.country,
        scope,
        scopeLabel,
        populationEstimate: populationCatalog[city.id] ?? null,
        radiusMeters,
        ...dynamicContext,
        taxContext: getTaxContext(city.country),
        updatedAt: new Date().toISOString(),
    }

    return {
        ...context,
        insightSummary: summarizeInsights(context),
    }
}
