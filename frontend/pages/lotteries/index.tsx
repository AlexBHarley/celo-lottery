import { useContractKit } from "use-contractkit"
import { CopyText, Panel, PanelWithButton, toast } from "components"
import { setPriority } from "os"
import { useCallback, useEffect, useState } from "react"
import Loader from "react-loader-spinner"
import { Base } from "state"
import add from "date-fns/add"
import differenceInSeconds from "date-fns/differenceInSeconds"

enum LotteryType {
  SavingsCelo = "SavingsCelo",
  Ubeswap = "Ubeswap",
  MoolaMarket = "Moola	Market",
}

const LOTTERY_TYPES = {
  [LotteryType.MoolaMarket]: {
    name: "Moola Market",
    color: "#3FCF82",
    url: "https://moola.market/",
  },
  [LotteryType.Ubeswap]: {
    name: "Ubeswap",
    color: "#8878c3",
    url: "https://ubeswap.org/",
  },
  [LotteryType.SavingsCelo]: {
    name: "Celo Vote",
    color: "#3f51b5",
    url: "https://celovote.com/",
  },
}

const testLotteries = [
  {
    name: "The best lottery around",
    deposited: {
      celo: "25000",
      usd: "1250000",
      wei: "1234567898765432112345678987654321",
    },
    endsAt: add(new Date(), { days: 7 }),
    prize: {
      celo: "250",
      usd: "1250",
      wei: "1234567898765432112345678987654321",
    },
    type: LotteryType.Ubeswap,
  },
  {
    name: "You know it's awesome",
    deposited: {
      celo: "25000",
      usd: "1250000",
      wei: "1234567898765432112345678987654321",
    },
    endsAt: add(new Date(), { hours: 13 }),
    prize: {
      celo: "250",
      usd: "1250",
      wei: "1234567898765432112345678987654321",
    },
    type: LotteryType.SavingsCelo,
  },
  {
    name: "The best lottery",
    deposited: {
      celo: "25000",
      usd: "1250000",
      wei: "1234567898765432112345678987654321",
    },
    endsAt: add(new Date(), { hours: 13 }),
    prize: {
      celo: "250",
      usd: "1250",
      wei: "1234567898765432112345678987654321",
    },
    type: LotteryType.MoolaMarket,
  },
]

function padWithZero(n: number): string {
  if (n >= 10) {
    return n.toString()
  }

  return `0${n.toString()}`
}

function calculateTicker(endsAt: Date) {
  const diffInSeconds = Math.abs(differenceInSeconds(new Date(), endsAt))

  const days = padWithZero(Math.floor(diffInSeconds / 60 / 60 / 24))
  const hours = padWithZero(Math.floor((diffInSeconds / 60 / 60) % 24))
  const minutes = padWithZero(Math.floor((diffInSeconds / 60) % 60))
  const seconds = padWithZero(Math.floor(diffInSeconds % 60))

  return {
    days,
    hours,
    minutes,
    seconds,
  }
}

function Ticker({ endsAt }: { endsAt: Date }) {
  const [ticker, setTicker] = useState(calculateTicker(endsAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(calculateTicker(endsAt))
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [endsAt])

  return (
    <div className="flex justify-between px-2">
      {/* days */}
      <div className="flex flex-col space-y-2">
        <div className="space-x-1">
          <span className="bg-gray-200 rounded p-2 font-mono">
            {ticker.days.toString().slice(0, 1)}
          </span>
          <span className="bg-gray-200 rounded p-2 font-mono">
            {ticker.days.toString().slice(1, 2)}
          </span>
        </div>
        <span className="mx-auto text-xs font-thin">DAYS</span>
      </div>

      <div></div>

      {/* hours */}
      <div className="flex flex-col space-y-2">
        <div className="space-x-1">
          <span className="bg-gray-200 rounded p-2 font-mono">
            {ticker.hours.toString().slice(0, 1)}
          </span>
          <span className="bg-gray-200 rounded p-2 font-mono">
            {ticker.hours.toString().slice(1, 2)}
          </span>
        </div>
        <span className="mx-auto text-xs font-thin">HRS</span>
      </div>

      <div>:</div>

      {/* minutes */}
      <div className="flex flex-col space-y-2">
        <div className="space-x-1">
          <span className="bg-gray-200 rounded p-2 font-mono">
            {ticker.minutes.toString().slice(0, 1)}
          </span>
          <span className="bg-gray-200 rounded p-2 font-mono">
            {ticker.minutes.toString().slice(1, 2)}
          </span>
        </div>
        <span className="mx-auto text-xs font-thin">MINS</span>
      </div>

      <div>:</div>

      {/* seconds */}
      <div className="flex flex-col space-y-2">
        <div className="space-x-1">
          <span className="bg-gray-200 rounded p-2 font-mono">
            {ticker.seconds.toString().slice(0, 1)}
          </span>
          <span className="bg-gray-200 rounded p-2 font-mono">
            {ticker.seconds.toString().slice(1, 2)}
          </span>
        </div>
        <span className="mx-auto text-xs font-thin">SEC</span>
      </div>
    </div>
  )
}

function CeloLogo(props: any) {
  return (
    <svg
      data-name="Celo Rings"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 950 950"
      {...props}
    >
      <title>{"Artboard 1"}</title>
      <path
        data-name="Bottom Ring"
        d="M375 850c151.88 0 275-123.12 275-275S526.88 300 375 300 100 423.12 100 575s123.12 275 275 275zm0 100C167.9 950 0 782.1 0 575s167.9-375 375-375 375 167.9 375 375-167.9 375-375 375z"
        fill="#fbcc5c"
      />
      <path
        data-name="Top Ring"
        d="M575 650c151.88 0 275-123.12 275-275S726.88 100 575 100 300 223.12 300 375s123.12 275 275 275zm0 100c-207.1 0-375-167.9-375-375S367.9 0 575 0s375 167.9 375 375-167.9 375-375 375z"
        fill="#35d07f"
      />
      <path
        data-name="Rings Overlap"
        d="M587.39 750a274.38 274.38 0 0054.55-108.06A274.36 274.36 0 00750 587.4a373.63 373.63 0 01-29.16 133.45A373.62 373.62 0 01587.39 750zM308.06 308.06A274.36 274.36 0 00200 362.6a373.63 373.63 0 0129.16-133.45A373.62 373.62 0 01362.61 200a274.38 274.38 0 00-54.55 108.06z"
        fill="#5ea33b"
      />
    </svg>
  )
}

export default function General() {
  const { kit } = useContractKit()
  const { summary } = Base.useContainer()
  const [lotteries, setLotteries] = useState(testLotteries)

  const [state, setState] = useState({
    name: "",
    metadataURL: "",
  })
  const [saving, setSaving] = useState(false)

  function changeProperty(property: string, value: any) {
    return setState((s) => ({ ...s, [property]: value }))
  }

  async function save() {
    if (
      summary.name === state.name &&
      summary.metadataURL === state.metadataURL
    ) {
      return
    }

    setSaving(true)
    try {
      const accounts = await kit.contracts.getAccounts()
      if (summary.name !== state.name) {
        await accounts.setName(state.name).sendAndWaitForReceipt()
      }
      if (summary.metadataURL !== state.metadataURL) {
        await accounts.setMetadataURL(state.metadataURL)
      }

      toast.success("Account data updated")
    } catch (e) {
      toast.error("Unable to update data")
    }

    setSaving(false)
  }

  return (
    <>
      <div className="px-3 py-2 space-y-4">
        {lotteries.map((l) => {
          return (
            <div className="relative border border-gray-300 shadow rounded px-8 py-4 space-y-2">
              <div className="text-sm font-medium text-gray-600"> {l.name}</div>
              <div className="pt-2">
                <div className="flex items-center space-x-3">
                  <CeloLogo className="h-10" />
                  <span className="text-5xl font-semibold">${l.prize.usd}</span>
                </div>
                <span className="text-sm font-light text-gray-500">
                  Next prize value {l.prize.celo} CELO
                </span>
              </div>

              <div className="pt-4">
                <Ticker endsAt={l.endsAt} />
              </div>

              <div className="pt-2 pb-6">
                <button className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  Enter draw now
                </button>
              </div>

              <span className="absolute text-sm text-gray-600 right-2 bottom-2">
                Powered by{" "}
                <a
                  target="_blank"
                  href={LOTTERY_TYPES[l.type].url}
                  style={{ color: LOTTERY_TYPES[l.type].color }}
                >
                  {LOTTERY_TYPES[l.type].name}
                </a>
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
