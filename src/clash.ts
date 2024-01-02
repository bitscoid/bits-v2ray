import yaml from 'js-yaml'
import { defaultClashConfig } from "./variables"
import { Config } from './interfaces';

export function ToYamlSubscription(configList: Array<Config>): string {
    let clash = defaultClashConfig
    clash.proxies = configList.map((conf: any) => (({merged, ...others}) => others)(conf))
    const groupedConfigs: any = configList.reduce((group: {[key: string]: any}, conf: any) => {
        if (!group[conf?.merged ? 'Worker' : 'BITS VPN']) {
            group[conf?.merged ? 'Worker' : 'BITS VPN'] = [];
        }
        group[conf?.merged ? 'Worker' : 'BITS VPN'].push(conf);
        return group;
    }, {});
    let proxyTiers: any = []
    for (const worker in groupedConfigs) {
        proxyTiers[worker] = groupedConfigs[worker]
    }
    let proxyGroups = [
        {
            name: "Internet",
            type: "select",
            "disable-udp": false,
            proxies: [
                "DIRECT",
                "Load Balance",
                "Best Latency",
            ].concat(Object.keys(proxyTiers)),
        },
        {
            name: "Load Balance",
            type: "load-balance",
            strategy: "round-robin",
            url: "http://www.gstatic.com/generate_204",
            interval: 360,
            "disable-udp": false,
            proxies: Object.keys(proxyTiers),
        },
        {
            name: "Best Latency",
            type: "url-test",
            url: "http://www.gstatic.com/generate_204",
            interval: 360,
            "disable-udp": false,
            proxies: Object.keys(proxyTiers),
        },
        {
            name: "Ads",
            type: "select",
            "disable-udp": false,
            proxies: [
                "REJECT",
                "Internet",
            ],
        },
        {
            name: "Adults",
            type: "select",
            "disable-udp": false,
            proxies: [
                "REJECT",
                "Internet",
            ],
        },
        {
            name: "Indonesia",
            type: "select",
            "disable-udp": false,
            proxies: [
                "Internet",
                "Best Latency",
            ].concat(Object.keys(proxyTiers)),
        },
        {
            name: "Streaming",
            type: "select",
            "disable-udp": false,
            proxies: [
                "Internet",
                "Best Latency",
            ].concat(Object.keys(proxyTiers)),
        },
        {
            name: "Social",
            type: "select",
            "disable-udp": false,
            proxies: [
                "Internet",
                "Best Latency",
            ].concat(Object.keys(proxyTiers)),
        },
        {
            name: "Game",
            type: "select",
            "disable-udp": false,
            proxies: [
                "Best Latency",
                "Internet",
            ].concat(Object.keys(proxyTiers)),
        },
        {
            name: "General",
            type: "select",
            "disable-udp": false,
            proxies: [
                "Internet",
                "Best Latency",
            ].concat(Object.keys(proxyTiers)),
        },
    ]
    for (const tier in proxyTiers) {
				var names = [];
			 	proxyTiers[tier].forEach(v => names.push(v.name));
        proxyGroups.push({
            name: tier,
            type: "url-test",
            url: "http://www.gstatic.com/generate_204",
            interval: 600,
            proxies: names,
        })
    }

    clash['proxy-groups'] = proxyGroups
    return yaml.dump(clash)
}
