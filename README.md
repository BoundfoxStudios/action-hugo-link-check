# Action: Hugo Link Check 

This action will check for broken links in a Hugo generated static webpage.

See a running example [here](https://github.com/BoundfoxStudios/community-project/blob/develop/.github/workflows/documentation.yml).

## Usage

### Inputs

All inputs are optional.

| Input                        | Description                                                                    | Default         |
|------------------------------|--------------------------------------------------------------------------------|-----------------|
| `fail-on-broken-links`       | The number of required broken links to fail the action. Set to 0 to deactivate | `1`             |
| `honor-robot-exclusions`     | Whether to honor or not robots.txt file, if present on the scanned webpage     | `false`         |
| `log-skipped-links`          | Logs skipped links and sends them to skipped-links output                      | `false`         |
| `excluded-schemes`           | Comma-separated list of schemes to exclude                                     | ``              |
| `exclude-external-links`     | Whether to exclude external links or not                                       | `false`         |
| `exclude-internal-links`     | Whether to exclude internal links or not                                       | `false`         |
| `exclude-links-to-same-page` | Whether to exclude links to the same page or not                               | `false`         |
| `hugo-root`                  | Base path to your hugo project                                                 | `./`            |
| `hugo-content-dir`           | Base path to your hugo content directory                                       | `./content`     |
| `hugo-config`                | Base path to your hugo config                                                  | `./config.yaml` |
| `hugo-startup-wait-time`     | Maximum time to wait for hugo to start up and process your project             | `20`            |


### Outputs

| Output                | Description                   |
|-----------------------|-------------------------------|
| `broken-links-count`  | Count of broken links         |
| `broken-links`        | JSON-Array with broken links  |
| `skipped-links-count` | Count of skipped links        | 
| `skipped-links`       | JSON-Array with skipped links |

### Example

```yaml
name: Example

on: [ push ]

jobs:
  check-broken-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: BoundfoxStudios/action-hugo-link-check@v1
        with:
          hugo-root: docs
          hugo-content-dir: docs/content
          hugo-config: docs/config.yaml
```
