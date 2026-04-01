import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const daysMin = searchParams.get('days_min')
    const daysMax = searchParams.get('days_max')
    const spot = searchParams.get('spot')
    const limit = parseInt(searchParams.get('limit') ?? '100', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    const supabase = getServiceClient()

    let query = supabase
      .from('piers_equipment_inventory')
      .select('*', { count: 'exact' })

    // Status filter
    if (status === 'available') {
      query = query
        .or('load_type.eq.Unknown,load_type.is.null')
        .not('comment', 'ilike', '%DO NOT USE%')
    } else if (status === 'reserved') {
      query = query.ilike('comment', '%RESERVED%')
    } else if (status === 'do_not_use') {
      query = query.ilike('comment', '%DO NOT USE%')
    } else if (status === 'loaded') {
      query = query.eq('load_type', 'Loaded')
    }

    // Free text search
    if (search) {
      query = query.or(
        `equip_no.ilike.%${search}%,comment.ilike.%${search}%,last_carrier.ilike.%${search}%,last_carrier_name.ilike.%${search}%`
      )
    }

    // Days onsite range
    if (daysMin) {
      query = query.gte('days_onsite', parseInt(daysMin, 10))
    }
    if (daysMax) {
      query = query.lte('days_onsite', parseInt(daysMax, 10))
    }

    // Spot filter
    if (spot) {
      query = query.eq('resource_name', spot)
    }

    // Pagination
    query = query
      .order('days_onsite', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, total: count })
  } catch (err) {
    console.error('Inventory route error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
