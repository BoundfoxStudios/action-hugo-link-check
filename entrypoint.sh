#!/usr/bin/env bash

pushd "$GITHUB_WORKSPACE/$HUGO_ROOT"

npm ci
npx hugo serve --baseUrl "http://localhost:1313" --contentDir "$GITHUB_WORKSPACE/$HUGO_CONTENT_DIR" --config "$GITHUB_WORKSPACE/$HUGO_CONFIG" &
HUGO_PID=$!

popd

echo "Waiting a maximum of $HUGO_STARTUP_WAIT_TIME seconds to let Hugo start up."

timeout $HUGO_STARTUP_WAIT_TIME bash -c 'until echo > /dev/tcp/localhost/1313; do sleep 0.5; done' &> /dev/null

TIMEOUT_RESULT=$?

if [ -n "$HUGO_PID" -a -e /proc/$HUGO_PID ]; then
  : # Everything ok
else
  exit 1
fi

if [[ "$TIMEOUT_RESULT" -eq 124 ]]; then
  echo "It looks like there was not enough time for Hugo to startup and process your page. You should increase hugo-startup-wait."
  exit 1
fi

echo "INPUTS --------------------------"
echo "$HUGO_ROOT"
echo "$HUGO_CONTENT_DIR"
echo "$HUGO_CONFIG"
echo "$HUGO_STARTUP_WAIT_TIME"
echo "$FAIL_ON_BROKEN_LINKS"
echo "$HONOR_ROBOT_EXCLUSIONS"
echo "$LOG_SKIPPED_LINKS"
echo "$EXCLUDED_SCHEMES"
echo "$EXCLUDE_EXTERNAL_LINKS"
echo "$EXCLUDE_INTERNAL_LINKS"
echo "$EXCLUDE_LINKS_TO_SAME_PAGE"
echo "/INPUTS --------------------------"

COMMAND="node /action/src/main.js check --url http://localhost:1313"

OUTPUT=$($COMMAND)
COMMAND_RESULT=$?

echo "$OUTPUT"

kill $HUGO_PID

if [[ "$COMMAND_RESULT" -ne 0 ]]; then
  exit $COMMAND_RESULT
fi
