"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type GoogleAnalyticsProps = {
	measurementId: string;
};

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		if (!measurementId || typeof window === "undefined" || !(window as any).gtag) return;
		const search = searchParams?.toString() ?? "";
		const url = pathname + (search ? `?${search}` : "");
		(window as any).gtag("event", "page_view", {
			page_location: url,
			page_title: document.title,
		});
	}, [measurementId, pathname, searchParams?.toString()]);

	return null;
}


