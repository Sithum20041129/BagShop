Configure the D1 Sync Webhook

Go to Webhooks → Add Endpoint, enter your Worker's webhook URL ([https://your-domain.com/api/webhooks/clerk](https://your-domain.com/api/webhooks/clerk)), subscribe to user.created, user.updated, and user.deleted, and copy the Signing Secret (whsec_...).

(When you move to production later, switch your Clerk Dashboard instance to Production, add your custom domain, and paste Clerk's CNAME records into your Cloudflare DNS—this takes under 5 minutes since you're already on Cloudflare.)