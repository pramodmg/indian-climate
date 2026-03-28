import type { CityContextDetails } from '../types/climate'

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

export function exportCityContextJson(context: CityContextDetails) {
    const blob = new Blob([JSON.stringify(context, null, 2)], {
        type: 'application/json;charset=utf-8',
    })
    downloadBlob(blob, `${context.cityId}-context.json`)
}

export function exportCityContextCsv(context: CityContextDetails) {
    const rows = [
        ['cityId', context.cityId],
        ['cityName', context.cityName],
        ['scope', context.scope],
        ['scopeLabel', context.scopeLabel],
        ['country', context.country],
        ['populationEstimate', context.populationEstimate ?? ''],
        ['dataSource', context.dataSource],
        ['radiusMeters', context.radiusMeters],
        ['buildingEstimate', context.buildingEstimate ?? ''],
        ['commercialPlaceCount', context.commercialPlaceCount ?? ''],
        ['taxSystemType', context.taxContext.systemType],
        ['taxNote', context.taxContext.note],
        ['updatedAt', context.updatedAt],
    ]

    for (const [label, count] of Object.entries(context.commercialBreakdown)) {
        rows.push([`commercial_${label}`, String(count)])
    }

    context.insightSummary.forEach((item, index) => {
        rows.push([`insight_${index + 1}`, item])
    })

    const csv = rows
        .map(([key, value]) => `"${String(key).replaceAll('"', '""')}","${String(value).replaceAll('"', '""')}"`)
        .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `${context.cityId}-context.csv`)
}
