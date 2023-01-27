## Problem

The query_range requests run queries on large amounts of data, which is computationally expensive. When the same request is issued to the query-service with the same start and end times or slightly different start and end times with a large overlapping window, it doesn't use the previously computed result, although there is no change (with some exceptions). The number of queries sent to ClickHouse is also rate limited because of its concurrency limitations, which results in high response times.

## Goals

- It should reduce the response times by 10x.

- It should work with all three signals.

- It should provide a unique interface to dashboards, alerts, or any other component in the system that wants to avoid the recomputation.

## Solution

Possible ways of implementation:

1. The incoming request is run, and its results are cached. This will keep the maximum window of results to be put into cache --cache-max-window-size.

Example:

```
{
    "start": 10.00,
    "end": 10.30,
    "step": 60,
    "query": "..."
}
```

When this is run, There will be a cached result for the duration of 10.00-10.30. For simplicity, the cached result is a single array with one point for 60 seconds. When a new request is received with start and end times as 10.04-10.34, the querier will find the overlapping interval and only queries data for 10.30-10.34; now, based on the max window size configured, this will update the cache entry. When the max window is 30, this will evict the 10.00-10.04 entries and add the 10.30-10.34 entries; if the window size is 60, then new partial entries are added without any eviction. The idea is to maintain the window of cached results for the query such that the value size is reasonable and the size is not small to add any benefit.


2. The incoming request is split into multiple sub-queries by interval (configurable), and each sub-query is run independently, and its' results are merged. There is a ttl for each cached sub-query result.

Example:

```
{
    "start": 10.00
    "end": 10.30
    "query": "..."
}
```

For an interval of 10 min, this will be split into

```
[
    {
        "start": 10.00,
        "end": 10.10,
        "query": "..."
    },
    {
        "start": 10.10,
        "end": 10.20,
        "query": "..."
    },
    {
        "start": 10.20,
        "end": 10.30,
        "query": "..."
    }
]
```

Each sub-query result is computed and cached for further use. When a new request comes at different times, it will be split along the same lines, and partial windows that don't have the result will be computed and put into the cache.

The cortex project inspires this. It makes sense for them since the project is built with these things in mind and has high query concurrency. What benefits does this add in our case? ClickHouse doesn't shine at the query concurrency.

3. Other approaches?

In either of the cases, the start and end times will be adjusted to make it better suited for the caching mechanism.


### Cache key generation

Two things in the request that change the results

1. Step
2. Query

- Builder queries

    (Step) + (MetricName) + (Operator) + (sorted(filters)) + (sorted(groupby))

- PromQL

    (Step) + (Query Expression)

- ClickHouse query

    Query without variables such as timestamps. Should we parse the query and prepare a generic applicable cache key?


```
type KeyGenerator interface {
	GenerateCacheKey(r Request) string
}
```

Each signal implements this interface. The result of query should be maintained with same data structure to enable better cache handling.

```
{
    "start": 10.00,
    "end": 10.30,
    "result": [
        {
            "labels": [...],
            "values": [
                [
                    timestamp,
                    value
                ],
                [
                    t2,
                    v2
                ]
            ]
        }
    ]
}
```

```
type Querier interface {
    Query(r Request) (result, error)
}

type rangeQuerier struct {
    cache *Cache
    metricKeyGenerator KeyGenerator
    tracesKeyGenerator KeyGenerator
    logsKeyGenerator KeyGenerator
}

func (r rangeQuerier) Query(r Request) (result, error) {
    // impl
}
```

query generation is not included here since it exists for metrics and out of scope for this work.


## Questions

- When the results are cached, but the data is ingested for the past time later in point time, then responses need to be corrected. Should we invalidate them?

- Should we make the cache backend configurable?

## Notes

- ClickHouse is working on adding query caching support for partial results/overlapping intervals. Does it make sense to offload this work to ClickHouse as well? https://github.com/ClickHouse/ClickHouse/issues/34011#issuecomment-1345821416

- ClickHouse is working on Streaming Queries with goals that can help us. https://github.com/ClickHouse/ClickHouse/issues/42990

- https://github.com/cortexproject/cortex/blob/master/docs/architecture.md#caching
