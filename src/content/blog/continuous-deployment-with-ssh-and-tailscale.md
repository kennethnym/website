---
title: continuous deployment with SSH and tailscale
description: A guide in implementing continuous deployment with SSH and Tailscale
pubDate: May 13 2025
---

*Skip to [high level overview](#high-level-overview) if you are not interested in the back story.*

I recently purchased a cheap Dell OptiPlex to act as my own server. I have since successfully moved all my services to the machine, including my [git server](https://code.nym.sh) and my website which was previously hosted on [Fly](https://fly.io). Without the awesome `fly deploy` command to deploy my website, I had to find another way to automate the deployment of my website.

Here comes the problem: my website is exposed to the public via [CloudFlare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/), but the host running my website isn't publicly accessible. This means that, for instance, I cannot SSH into the host in a CI/CD environment, such as GitHub Actions.

Thankfully, using [Tailscale](https://tailscale.com/), I can securely access any of my devices, even outside my home network.

## Why Tailscale?

Based on [WireGuard](https://www.wireguard.com/), Tailscale lets you set up your own VPN with ease for your own devices, which forms a "tailnet". Any device connected to the tailnet can securely access other devices within it using the corresponding assigned address.

Therefore, if I can manage to connect a machine to my tailnet, I will be able to access my host anywhere, in any environment, including CI/CD pipelines. Fortunately, Tailscale maintains a [GitHub Action](https://tailscale.com/kb/1276/tailscale-github-action) that lets you connect to your tailnet in a GitHub Action runner.

## High Level Overview

1. Trigger continuous deployment when commits are made to the main branch
2. Connect the runner of the continuous deployment pipeline to the tailnet to which your host is connected
3. SSH into the host using the assigned IP
4. Pull the new commits on the host, and re-deploy the website

I will be using GitHub Action syntax for the CI/CD config file, but the overarching concept applies to any CI/CD environment.

## The Basics

Start with the following code:

```yml
on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy website to server
    env:
      MACHINE_USER_NAME: user
      MACHINE_NAME: my-host
```

This allows the pipeline to be triggered when commits are made to the `main` branch, and manually in the GitHub UI.

Two environment variables are also defined here:
- `MACHINE_USER_NAME`: the name of the user used for SSH-ing into the machine; and
- `MACHINE_NAME`: the name of the machine assigned by Tailscale. You can find this out in the admin console of Tailscale.

## Setting Up Tailscale GitHub Action

### Defining a Tag

In Tailscale, you can assign and group machines with *tags*. One of their primary purposes is to allow you to apply access control to machines based on tags.

In this case, it is useful to assign the runner running the CI/CD pipeline a tag. Then, using Tailscale's [Access Control Lists (ACLs)](https://tailscale.com/kb/1018/acls), we can limit access the tag has to the host to which we wish to deploy. We will name it `tag:ci`.

To define a tag, navigate to the "Access Controls" page in the admin console. You will then be presented with an editor for the ACL file. Within the `"tagOwners"` key, add the following:

```json
{
    "tagOwners": {
        "tag:ci": ["autogroup:owner"]
    }
}
```

`"autogroup:owner"` specifies that the owner of the tailnet can apply this tag. Before we move on, make a note of the IP address of the machine that will be hosting the service. 

Now, let's define an ACL for the tag. We want machines that are tagged with `tag:ci` to be able to SSH into the host machine and nothing else. As an example, we will use `1.2.3.4` as the IP address of the machine.

```json
{
    "acls": [
        // other lists
        {"action": "accept", "src": ["tag:ci"], "dst": ["1.2.3.4:22"]}
    ]
}
```

This specifies that machines tagged with `tag:ci` can only access machine with IP `1.2.3.4` on port `22`, which is the default SSH port. If your machine has a non-standard SSH port, change `22` to the correct port.

### Creating an OAuth Client

Tailscale's GitHub Action relies on OAuth2 for authentication. To get started, go to the admin console, then navigate to the "OAuth Clients" section in settings. Give the client a descriptive name, and make sure the [`auth_keys` scope](https://tailscale.com/kb/1215/oauth-clients#scopes) is enabled. Take a note of the client ID and client secret, and store them as GitHub Action secrets.

Now, add a step in the workflow file to set up Tailscale:

```yml
on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy website to server
    env:
      MACHINE_USER_NAME: user
      MACHINE_NAME: my-host
    steps:
      - name: Setup Tailscale
        uses: tailscale/github-action@v3
        with:
          oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
          oauth-secret: ${{ secrets.TS_OAUTH_CLIENT_SECRET }}
          tags: 'tag:ci'
```

This step installs Tailscale on the runner machine, and authenticates it into our tailnet using the OAuth credentials we created. The `tag:ci` is also applied to the runner, which means it can access the machine at `1.2.3.4` on port 22 and nothing else.

## Setting Up SSH Access

To let the CI/CD runner authenticate over SSH, we will need to:

1. Generate an SSH key pair
2. Install the public key to the host machine, and 
3. Save the private key as a GitHub secret to be used in the workflow.

Once you have completed the steps above, add the following workflow step after the Tailscale setup step:

```yml
- name: Add SSH key
  env:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
  run: |
    mkdir -p ~/.ssh
    MACHINE_IP="$(tailscale ip -4 $MACHINE_NAME)"
    ssh-keyscan $MACHINE_IP >> ~/.ssh/known_hosts
    printf "%s" "$SSH_PRIVATE_KEY" > ~/.ssh/key
    # add a new line to the end of the private key file
    # otherwise it won't be loaded properly
    echo >> ~/.ssh/key
    chmod 600 ~/.ssh/key
```

Let's break down the script:

1. Create the default SSH directory if it does not exist
2. Using Tailscale's CLI to find the IPv4 of the host machine by its assigned name, and store it in `MACHINE_IP` variable
3. Perform a key scan on the machine, then add it to the list of known hosts
4. Save the private key in GitHub secret (made available as an environment variable via the `env` block) to `~/.ssh/key` file
5. GitHub trims any trailing newline character in a secret value. Because SSH expects a trailing newline character at the end of a key file, a new line needs to be appended to the end of the key file created in the previous step
6. Correct the permission of the key file

## Deploying the Website

With everything in place, the runner is now able to SSH into the host machine via Tailscale! How you deploy your services may vary, so I will use [my website](https://github.com/kennethnym/website/blob/main/.github/workflows/deploy.yml) as an example, which is stored as a git repo on the host machine and is run as a Docker container.

The important part here is obtaining the machine IP using its assigned name, which we did in the previous step; passing the correct key file to SSH; and finally providing the correct username and IP.

```yml
- name: Deploy website
  env:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
  run: |
    MACHINE_IP="$(tailscale ip -4 $MACHINE_NAME)"
    ssh -i ~/.ssh/key "$MACHINE_USER_NAME@$MACHINE_IP" /bin/bash << EOF
      cd /opt/website
      git pull
      docker build -t website .
      docker stop website-container
      docker rm website-container
      docker run --name website-container --restart=always --publish 5432:80 --detach website
    EOF
```

## References

- [Using GitHub Actions and Tailscale to build and deploy applications securely](https://tailscale.com/blog/2021-05-github-actions-and-tailscale)

## Final Notes

We have successfully created a GitHub Action workflow that automatically deploys a service over SSH using Tailscale, without public access to our host machine. I hope you find this guide helpful, and thank you for reading.

Please don't hesitate to reach out should you spot any mistake.