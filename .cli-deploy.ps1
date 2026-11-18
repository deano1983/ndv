# Deploy with netlify-cli. The token is read from the NETLIFY_AUTH_TOKEN environment
# variable; never hard-code it here. Set it for the session first, e.g.
#   $env:NETLIFY_AUTH_TOKEN = '<your token>'
if (-not $env:NETLIFY_AUTH_TOKEN) { throw "NETLIFY_AUTH_TOKEN is not set" }
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
npx netlify-cli deploy --prod --dir dist/client --functions netlify/functions --site ndv-luxury --message standalone-stripe > .cli-deploy-log.txt 2>&1
