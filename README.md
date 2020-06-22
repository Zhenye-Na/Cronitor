# Cronitor

🗃️ Golang implemented Distributed Task Scheduler with Web UI Tool for High-performance Crontab

## Overview

<div align="center">
  <img src="./assets/keywords.png" width="50%">
</div>


## Tech Stack

Golang as main developing language, MongoDB as the database to store logs, Etcd as the distributed key-value store to save cron jobs in the backend

<div align="center">
  <img src="./assets/architecture.png" width="50%">
</div>

## Usage

```sh
# master
$ go build master.go

# worker
$ go build worker.go
```

## Demo

<div align="center">
  <img src="./assets/demo.png" width="50%">
</div>
