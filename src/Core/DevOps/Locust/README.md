# Quick start

## Installation

Install locust on the machine which executes the benchmark. https://docs.locust.io/en/stable/installation.html

Additionally, you have to install the following dependencies:
- [Beautiful Soup](hhttps://pypi.org/project/beautifulsoup4/) - `pip install beautifulsoup4`
- [Faker](https://faker.readthedocs.io/en/master/) - `pip install faker`

## Setup

To keep the test simple and flexible, the script needs some data from the API.
The corresponding data can also be determined automatically from the `setup.php` file and written into the corresponding *.json files.
To allow benchmarks on external machines, the data will be detected over the API.
Therefore, you have to insert the oauth credentials into the `env.json` file into the oauth section.
```json
{
    "url": "http://sw6.dev.localhost",
    "oauth": {
        "client_id": "administration",
        "grant_type": "password",
        "username": "admin",
        "password": "shopware"
    }
}
```

After inserting the credentials, you can run the setup with the following command:
```shell
composer run locust:init
```

## Environment
The `env.json` file allows the following configurations:
- `url`: The base url of the shopware api.
- `oauth`: The oauth credentials.
- `wait`: The time in seconds to wait between requests. To disable wait time define `"wait": false`. The default value is `[3, 5]` which defines a minimal wait time of 3 seconds to a maximum of 5.
- `aggregate`: If enabled, groups the requests by a logical key. Default `true`.
- `indexing_behavior`: Allows to configure the indexing behavior. The default value is `false`. Allowed behavior values are: `disable-indexing`, `use-queue-indexing`
- `max_api_user`: Allows to limit the number of users which sends requests against the sync api

## Enabled cache
Since locust is a benchmark script, the caches should be enabled.
Simply add the following section to one of your local configuration files in {root}/config/packages/*.yaml. 
(Choose redis, if you have a multi app server setup)

```yaml
framework:
    cache:
        app: cache.adapter.filesystem

#framework:
#    cache:
#        app: cache.adapter.redis
#    session:
#      handler_id: 'redis://redis:6379'
```

You may also want to configure a delayed cache, which invalidates all tags after a given time.
```yaml
shopware:
    cache:
        invalidation:
            delay: 30
            count: 150
```
Only tags which are not invalidated again within the last 30 seconds will be invalidated. This prevents duplicate invalidation calls. The `count` property defines how many tags are invalidated at the same time.

## Disabled csrf protection 
To allow registrations and tracing the order process, the csrf protection has to be disabled. 
Simply add the following section to one of your local configuration files in {root}/config/packages/*.yaml

```yaml
storefront:
    csrf:
        enabled: false
```

## Run locust
You can run the benchmark with the following command:
```shell
composer run locust:run
```

If you use `shopware docker (swdc)` you can simply run the benchmark with the following command:
```shell
swdc locust sw6 
```

