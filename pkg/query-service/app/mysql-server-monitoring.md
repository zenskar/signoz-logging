MySQL is one of the most popular and widely used relational database systems. It powers
the largest websites on the internet, such as YouTube, GitHub, Pinterest, Spotify, and More. Relational databases have become an integral part of modern applications of all sizes. It is crucial to monitor the performance of the database since it plays a significant role in the latency observed by the end user. It helps you to understand how parts of the database are performing and potentially optimize the slowest components.

This article assumes there is an instance of MySQL server running.

There are three steps involved in getting the MySQL server monitored successfully.

1. Metrics collection & transportation
2. Storage
3. Visualizing the collected metrics

SigNoz takes care of your storage concerns and provides you with visualization capabilities. In the next, we will focus on metrics collection and transportation.

There are two ways SigNoz supports collecting MySQL server metrics.

1. `mysqlreceiver` with OpenTelemetry Collector
2. `mysqld_exporter` Prometheus exporter

`mysqlreceiver` provided by OTEL Collector is still under active development and doesn't provide as many metrics as `mysqld_exporter`, and it may have included all the metrics necessary for you. We will mainly focus on the `mysqld_exporter` and provide the instruction for `mysqlreceiver`. 

## Installing `mysqld_exporter`

```
VERSION="0.14.0"
OS= "darwin"
ARCH="arm64"
wget "https://github.com/prometheus/mysqld_exporter/releases/download/v${VERSION}/mysqld_exporter-${VERSION}.${OS}-${ARCH}.tar.gz"
tar xvzf "mysqld_exporter-${VERSION}.${OS}-${ARCH}.tar.gz"
```

## Setting up for metrics collection user

```
CREATE USER 'exporter'@'localhost' IDENTIFIED BY 'TO-BE-REPLACED-WITH-PASSWORD' WITH MAX_USER_CONNECTIONS 4;
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'localhost';
```

A max connection limit of 3 for the user is set to avoid overloading the server with monitoring scrapes under heavy load. This is not supported on all MySQL/MariaDB versions; for example, MariaDB 10.1 (provided with Ubuntu 18.04)

## Running `mysqld_exporter`

Create a config file to be used with MySQL with the user added from the previous step.

```
[client]
user=exporter
password=password-from-prev-step
host=localhost
```

Now run the exporter using this config as follows. On a successfull run, this exporter will expose metrics on the same host and port 8899.

```
./mysqld_exporter --config.my-cnf my.cnf --web.listen-address=0.0.0.0:8899
```

## Configuring SigNoz to receive data

SigNoz runs a pod/container named `otel-collector-metrics` to enable the metrics collection of Prometheus compatible exporters. It runs a scraper which is similar to Prometheus but has some limitations. Please read this for more info.

To receive the data exposed by `mysqld_exporter`, we need to add a new scrape job to the `otel-collector-metrics` config.

```
receivers:
  otlp:
    protocols:
      grpc:
      http:
  prometheus:
    config:
      scrape_configs:
        ...
        - job_name: mysql # To get metrics about the mysql exporter's targets
        static_configs:
          - targets:
            # All mysql hostnames to monitor.
            - server1:3306
            - server2:3306
        relabel_configs:
          - source_labels: [__address__]
            target_label: __param_target
          - source_labels: [__param_target]
            target_label: instance
          - target_label: __address__
            # The mysqld_exporter host:port
            replacement: localhost:9104
        ...
```

## Verifying and visualizing the MySQL monitoring data
