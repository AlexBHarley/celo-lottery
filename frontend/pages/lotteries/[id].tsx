import { useContractKit } from "use-contractkit";
import { CopyText, Panel, PanelWithButton, toast } from "components";
import { setPriority } from "os";
import { useCallback, useEffect, useState } from "react";
import Loader from "react-loader-spinner";
import { Base } from "state";
import add from "date-fns/add";
import differenceInSeconds from "date-fns/differenceInSeconds";
import format from "date-fns/format";
import Link from "next/link";

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
};

const testLottery = {
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
	address: "0x1234",
};

function padWithZero(n: number): string {
	if (n >= 10) {
		return n.toString();
	}

	return `0${n.toString()}`;
}

function calculateTicker(endsAt: Date) {
	const diffInSeconds = Math.abs(differenceInSeconds(new Date(), endsAt));

	const days = padWithZero(Math.floor(diffInSeconds / 60 / 60 / 24));
	const hours = padWithZero(Math.floor((diffInSeconds / 60 / 60) % 24));
	const minutes = padWithZero(Math.floor((diffInSeconds / 60) % 60));
	const seconds = padWithZero(Math.floor(diffInSeconds % 60));

	return {
		days,
		hours,
		minutes,
		seconds,
	};
}

function Ticker({ endsAt }: { endsAt: Date }) {
	const [ticker, setTicker] = useState(calculateTicker(endsAt));

	useEffect(() => {
		const interval = setInterval(() => {
			setTicker(calculateTicker(endsAt));
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	}, [endsAt]);

	return (
		<div className="flex justify-between px-2">
			{/* days */}
			<div className="flex flex-col space-y-2">
				<div className="space-x-1">
					<span className="shadow-md bg-purple-500 rounded p-2 font-mono">
						{ticker.days.toString().slice(0, 1)}
					</span>
					<span className="shadow-md bg-purple-500 rounded p-2 font-mono">
						{ticker.days.toString().slice(1, 2)}
					</span>
				</div>
				<span className="mx-auto text-xs font-light">DAYS</span>
			</div>

			<div></div>

			{/* hours */}
			<div className="flex flex-col space-y-2">
				<div className="space-x-1">
					<span className="shadow-md bg-purple-500 rounded p-2 font-mono">
						{ticker.hours.toString().slice(0, 1)}
					</span>
					<span className="shadow-md bg-purple-500 rounded p-2 font-mono">
						{ticker.hours.toString().slice(1, 2)}
					</span>
				</div>
				<span className="mx-auto text-xs font-light">HRS</span>
			</div>

			<div>:</div>

			{/* minutes */}
			<div className="flex flex-col space-y-2">
				<div className="space-x-1">
					<span className="shadow-md bg-purple-500 rounded p-2 font-mono">
						{ticker.minutes.toString().slice(0, 1)}
					</span>
					<span className="shadow-md bg-purple-500 rounded p-2 font-mono">
						{ticker.minutes.toString().slice(1, 2)}
					</span>
				</div>
				<span className="mx-auto text-xs font-light">MINS</span>
			</div>

			<div>:</div>

			{/* seconds */}
			<div className="flex flex-col space-y-2">
				<div className="space-x-1">
					<span className="shadow-md bg-purple-500 rounded p-2 font-mono">
						{ticker.seconds.toString().slice(0, 1)}
					</span>
					<span className="shadow-md bg-purple-500 rounded p-2 font-mono">
						{ticker.seconds.toString().slice(1, 2)}
					</span>
				</div>
				<span className="mx-auto text-xs font-light">SEC</span>
			</div>
		</div>
	);
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
	);
}

function PastWinner({
	address,
	amount,
	endsAt,
}: {
	amount: number;
	address: string;
	endsAt: Date;
}) {
	return (
		<li>
			<a href="#" className="block hover:bg-gray-50">
				<div className="flex items-center px-4 py-4 sm:px-6">
					<div className="min-w-0 flex-1 flex items-center">
						<div className="flex-shrink-0">
							<img
								className="h-12 w-12 rounded-full"
								src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixqx=qcGnavWRcu&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
							/>
						</div>
						<div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
							<div>
								<p className="text-sm font-medium text-indigo-600 truncate">
									Unknown
								</p>
								<p className="mt-1 flex items-center text-sm text-gray-500">
									<span className="truncate">{address}</span>
								</p>
							</div>
						</div>
					</div>
					<div className="text-right">
						<div className="text-gray-600">US${amount}</div>
						<div className="text-gray-600">{format(endsAt, "dd MMMM")}</div>
					</div>
				</div>
			</a>
		</li>
	);
}

export default function General() {
	const { kit } = useContractKit();
	const { summary } = Base.useContainer();
	const [lottery, setLottery] = useState(testLottery);

	const [state, setState] = useState({
		name: "",
		metadataURL: "",
	});
	const [saving, setSaving] = useState(false);

	return (
		<>
			<div className="px-4 py-4">
				<div>
					<div className="font-medium text-2xl">{lottery.name}</div>

					<div className="text-sm text-gray-500">
						Created by Alex (
						<a target="_blank" className="text-gray-300 te">
							0x1234
						</a>
						) on 24th January.
					</div>
				</div>

				<div className="py-4">
					<div
						// className="shadow border border-gray-300"
						className="w-full px-6 py-4 border border-transparent flex flex-col rounded-md shadow-sm text-base text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
					>
						<div>
							<span className="text-4xl font-medium">${lottery.prize.usd}</span>
							<div className="flex items-center space-x-2">
								<CeloLogo className="h-3 w-3" />
								<span className="text-sm"> {lottery.prize.celo} CELO</span>
							</div>
						</div>

						<div className="mt-4 space-y-2">
							<span className="font-light text-sm">Prize awarded in</span>
							<Ticker endsAt={lottery.endsAt} />
						</div>
					</div>
				</div>

				<>
					{/* This example requires Tailwind CSS v2.0+ */}
					<div>
						<dl className="mt-5 grid grid-cols-1 rounded-lg bg-white overflow-hidden shadow divide-y divide-gray-200 md:grid-cols-3 md:divide-y-0 md:divide-x">
							<div>
								<div className="px-4 py-5 sm:p-6">
									<dt className="text-base font-normal text-gray-900">
										Total Deposited
									</dt>
									<dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
										<div className="flex items-baseline text-2xl font-semibold text-indigo-600">
											71,897
											<span className="ml-2 text-sm font-medium text-gray-500">
												from 70,946
											</span>
										</div>
										<div className="inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 md:mt-2 lg:mt-0">
											<svg
												className="-ml-1 mr-0.5 flex-shrink-0 self-center h-5 w-5 text-green-500"
												fill="currentColor"
												viewBox="0 0 20 20"
												aria-hidden="true"
											>
												<path
													fillRule="evenodd"
													d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											<span className="sr-only">Increased by</span>
											12%
										</div>
									</dd>
								</div>
							</div>
							<div>
								<div className="px-4 py-5 sm:p-6">
									<dt className="text-base font-normal text-gray-900">
										Player count
									</dt>
									<dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
										<div className="flex items-baseline text-2xl font-semibold text-indigo-600">
											58.16%
											<span className="ml-2 text-sm font-medium text-gray-500">
												from 56.14%
											</span>
										</div>
										<div className="inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 md:mt-2 lg:mt-0">
											<svg
												className="-ml-1 mr-0.5 flex-shrink-0 self-center h-5 w-5 text-green-500"
												fill="currentColor"
												viewBox="0 0 20 20"
												aria-hidden="true"
											>
												<path
													fillRule="evenodd"
													d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											<span className="sr-only">Increased by</span>
											2.02%
										</div>
									</dd>
								</div>
							</div>
							<div>
								<div className="px-4 py-5 sm:p-6">
									<dt className="text-base font-normal text-gray-900">
										Prize source
									</dt>
									<dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
										<div className="flex items-baseline text-2xl font-semibold text-indigo-600">
											{LOTTERY_TYPES[lottery.type].name}
										</div>
									</dd>
								</div>
							</div>
						</dl>
					</div>
				</>

				<div>
					<div className="text-lg font-medium mb-2">Current players</div>
				</div>

				<>
					<div className="text-lg font-medium mb-2">Past winners</div>
					{/* This example requires Tailwind CSS v2.0+ */}
					<div className="bg-white shadow overflow-hidden sm:rounded-md">
						<ul className="divide-y divide-gray-200">
							{Array(5)
								.fill(null)
								.map((f) => (
									<PastWinner
										address="0x1234"
										amount={500}
										endsAt={new Date()}
									/>
								))}
						</ul>
					</div>
				</>
			</div>
		</>
	);
}
