---
title: a gentle introduction to cloudflare tunnels
description: A guide in using CloudFlare Tunnels to expose services to the Internet
pubDate: May 28 2025
---

CloudFlare Tunnel allows you to expose services within a network to the public without a publicly routable IP address. For example, you can expose a website to the public under a public hostname, without exposing your machine's IP address. You don't even need to deal with SSL for HTTPS, as this is automatically handled by CloudFlare! This can be beneficial because, for one, exposing your machine directly to the Internet poses a potential security risk; for another, it might not be feasible to do so. By exposing your services with Tunnel, you receive all the benefits of using CloudFlare network, including DDoS protection, caching, and more, without exposing your machines to the public.

CloudFlare Tunnels support many protocols, including HTTP/S, TCP, UDP, and even SSH. This unlocks many use cases beyond exposing HTTP services. As an example, you can expose a game server, such as a Minecraft server, over TCP, under a publicly accessible hostname.

## How does CloudFlare Tunnel work?

CloudFlare Tunnel relies on a persistent *connector* called `cloudflared` that establishes an **encrypted** connection between your machine and the global CloudFlare network. Each connector is bound to a tunnel, which maps a public hostname to an address the connector can access. As an example, [code.nym.sh](code.nym.sh), my public Gitea instance, is mapped to `http://localhost:3000`. Since the associated `cloudflared` is running on the same host, it can access `localhost`, and therefore any locally running service, including Gitea.

Suppose a service is exposed under `service-a.com` which is publicly accessible, and an HTTP request is made to it. The request will go through the following steps:

1. It is routed to CloudFlare's network
2. Based on the hostname, it is then forwarded to the corresponding tunnel.
3. The request is then forwarded to the appropriate connector, which then forwards it to the configured (local) address.

This is a high-level overview of CloudFlare tunnel's architecture. If you are interested in the details of Tunnel, including how it handles redundancy and failover, check out [this official reference document](https://developers.cloudflare.com/reference-architecture/architectures/sase/#tunnels-to-self-hosted-applications).

## Deploying `cloudflared`

There are different ways you can deploy `cloudflared`. I have tried the following approaches:

1. Running `cloudflared` on the same host where the services are running (this is my setup currently)
2. Running `cloudflared` on a separate machine in the same network (for example, within the same Tailnet) where the services are running

In the first scenario, an instance of `cloudflared` is deployed on the machine that is running the service you wish to expose. In my case, I have 2 machines running different services I need to expose, so I deployed 2 instances of `cloudflared`, each responsible for exposing the services running on the same machine.

In the second scenario, an instance of `cloudflared` is deployed on a dedicated machine that acts as the "gateway" to services running in your network. This can look like one machine running `cloudflared` in a Tailnet that is responsible for the tunneling of services running in the same network, potentially on different machines.

There are no right or wrong approaches. I am providing these scenarios as reference points, but use your best judgment to adapt them to your needs.

## Configuring CloudFlare Tunnel

*Before creating a Tunnel, make sure that the domains you wish to use is added to CloudFlare ([guide here](https://developers.cloudflare.com/fundamentals/setup/manage-domains/add-site/)).*

Creating a Tunnel is straightforward. First, create a CloudFlare Tunnel in the Zero Trust CloudFlare dashboard. CloudFlare should then provide instructions on how to install and run `cloudflared` for different environments and operating systems.

Once the connector is online, add a public hostname to the tunnel. You can map a root domain name, subdomains, and even subpaths. Then, specify the type and the local address for the service that you want to expose. For example, if you want to expose your backend server running on `localhost:8000` under the URL `https://api.acme.com`, do the following:

- Specify `api` as subdomain
- Specify `acme.com` as domain
- Specify the service type as `HTTP` (not `HTTPS`, as this is from the perspective of the connector)
- Specify the URL as `localhost:8000`

Save the settings, and voila! You have exposed your backend to the public Internet! How easy is that?

## Final Words

As always, feel free to shoot me an email or DM me on X if you have any questions about CloudFlare Tunnels.