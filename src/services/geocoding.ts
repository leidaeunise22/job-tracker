export interface GeoCity {
  id: string
  name: string
  state: string
  country: string
  displayName: string
}

export async function searchCities(query: string): Promise<GeoCity[]> {
  if (query.trim().length < 2) return []
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '10',
    addressdetails: '1',
  })
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'JobTrackerApp/1.0' } },
  )
  if (!res.ok) return []
  const data: any[] = await res.json()

  const seen = new Set<string>()
  const results: GeoCity[] = []

  for (const r of data) {
    const isCity = r.class === 'place' && ['city', 'town', 'municipality'].includes(r.type)
    const isAdmin = r.class === 'boundary' && r.type === 'administrative' && r.addresstype === 'city'
    if (!isCity && !isAdmin) continue

    const name =
      r.address?.city || r.address?.town || r.address?.municipality || r.name
    const state = r.address?.state || r.address?.county || ''
    const country = r.address?.country || ''
    const key = `${name.toLowerCase()}-${country.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)

    const slug = `${name} ${country}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    results.push({
      id: `custom-${slug}`,
      name,
      state,
      country,
      displayName: [name, state, country].filter(Boolean).join(', '),
    })
  }

  return results
}
