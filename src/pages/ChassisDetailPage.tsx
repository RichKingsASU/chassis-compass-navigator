import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import ChassisHeader from '@/components/chassis-detail/ChassisHeader'
import CurrentLocationCard from '@/components/chassis-detail/CurrentLocationCard'
import ActiveLoadCard from '@/components/chassis-detail/ActiveLoadCard'
import GpsTelematicsPanel from '@/components/chassis-detail/GpsTelematicsPanel'
import TmsHistoryPanel from '@/components/chassis-detail/TmsHistoryPanel'
import UtilizationMetricsCard from '@/components/chassis-detail/UtilizationMetricsCard'
import RevenueHistoryChart from '@/components/chassis-detail/RevenueHistoryChart'
import VendorActivityCard from '@/components/chassis-detail/VendorActivityCard'
import PierSEventsCard from '@/components/chassis-detail/PierSEventsCard'
import AxleSwapFlagCard from '@/components/chassis-detail/AxleSwapFlagCard'
import ChassisAiAgent from '@/components/chassis-detail/ChassisAiAgent'
import { useChassisDetailData } from '@/components/chassis-detail/useChassisDetailData'
import { buildChassisAgentSystemPrompt } from '@/components/chassis-detail/ChassisAgentContext'
import type { ChassisAgentSummary, GpsPing } from '@/components/chassis-detail/types'

function pickLatestPing(...lists: GpsPing[][]): GpsPing | null {
  let latest: GpsPing | null = null
  let latestTs = -Infinity
  for (const list of lists) {
    for (const p of list) {
      if (!p.timestamp) continue
      const ts = new Date(p.timestamp).getTime()
      if (isNaN(ts)) continue
      if (ts > latestTs) {
        latestTs = ts
        latest = p
      }
    }
  }
  return latest
}

export default function ChassisDetailPage() {
  const { chassisNumber: rawParam } = useParams<{ chassisNumber: string }>()
  const chassisNumber = useMemo(() => {
    try {
      return decodeURIComponent(rawParam || '').trim()
    } catch {
      return (rawParam || '').trim()
    }
  }, [rawParam])

  const data = useChassisDetailData(chassisNumber)

  const latestPing = useMemo(
    () =>
      pickLatestPing(
        data.bbTran.data,
        data.bbLog.data,
        data.fleetlocate.data,
        data.anytrek.data
      ),
    [data.bbTran.data, data.bbLog.data, data.fleetlocate.data, data.anytrek.data]
  )

  const primaryReady =
    !data.identity.loading &&
    !data.bbTran.loading &&
    !data.bbLog.loading &&
    !data.fleetlocate.loading &&
    !data.anytrek.loading &&
    !data.activeLoad.loading &&
    !data.loads.loading

  const systemPrompt = useMemo(() => {
    if (!primaryReady || !data.identity.data) return null
    const summary: ChassisAgentSummary = {
      identity: data.identity.data,
      latestPing,
      activeLoad: data.activeLoad.data,
      loads: data.loads.data,
      dcliRows: data.dcli.data,
      pierSCount: data.pierS.data.length,
      pierSLatest: data.pierS.data[0]?.EventDate ?? null,
      axleSwap: data.axleSwap.data,
      perSourceLast: {
        BlackBerry:
          data.bbTran.data[0]?.timestamp ?? data.bbLog.data[0]?.timestamp ?? null,
        FleetLocate: data.fleetlocate.data[0]?.timestamp ?? null,
        Anytrek: data.anytrek.data[0]?.timestamp ?? null,
      },
    }
    return buildChassisAgentSystemPrompt(chassisNumber, summary)
  }, [
    primaryReady,
    data.identity.data,
    latestPing,
    data.activeLoad.data,
    data.loads.data,
    data.dcli.data,
    data.pierS.data,
    data.axleSwap.data,
    data.bbTran.data,
    data.bbLog.data,
    data.fleetlocate.data,
    data.anytrek.data,
    chassisNumber,
  ])

  if (!chassisNumber) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No chassis number provided.
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)]">
        {/* LEFT column */}
        <div className="space-y-6 min-w-0">
          <ChassisHeader
            chassisNumber={chassisNumber}
            identity={data.identity.data}
            identityLoading={data.identity.loading}
            latestPing={latestPing}
          />
          <AxleSwapFlagCard
            flag={data.axleSwap.data}
            loading={data.axleSwap.loading}
          />
          <CurrentLocationCard
            ping={latestPing}
            loading={
              data.bbTran.loading ||
              data.bbLog.loading ||
              data.fleetlocate.loading ||
              data.anytrek.loading
            }
          />
          <ActiveLoadCard
            activeLoad={data.activeLoad.data}
            loading={data.activeLoad.loading}
            recentLoads={data.loads.data}
          />
          <GpsTelematicsPanel
            bbTran={data.bbTran}
            bbLog={data.bbLog}
            fleetlocate={data.fleetlocate}
            anytrek={data.anytrek}
          />
          <TmsHistoryPanel loads={data.loads.data} loading={data.loads.loading} />
          <UtilizationMetricsCard
            loads={data.loads.data}
            loading={data.loads.loading}
            latestPing={latestPing}
          />
          <RevenueHistoryChart
            loads={data.loads.data}
            loading={data.loads.loading}
          />
          <VendorActivityCard rows={data.dcli.data} loading={data.dcli.loading} />
          <PierSEventsCard rows={data.pierS.data} loading={data.pierS.loading} />
        </div>

        {/* RIGHT column — sticky AI agent */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
            <ChassisAiAgent
              chassisNumber={chassisNumber}
              systemPrompt={systemPrompt}
              contextLoading={!primaryReady}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
