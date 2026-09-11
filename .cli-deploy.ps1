$env:NETLIFY_AUTH_TOKEN = 'nfc_cwbDk8j6SRJRxDxWCtbNkodcbPhedd7Qd4d9'; cd C:
dv; npx netlify-cli deploy --prod --dir dist/client --functions netlify/functions --site ndv-luxury --message standalone-stripe > .cli-deploy-log.txt 2>&1
