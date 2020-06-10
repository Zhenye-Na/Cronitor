package main

import (
  "fmt"
  "go-crontab/source/crontab/master"
  "runtime"
  "time"
)

// 初始化线程数量
func initEnv() {
  runtime.GOMAXPROCS(runtime.NumCPU())
}

func main() {

  var (
    err error
  )

  // 初始化线程
  initEnv()

  // 启动Api HTTP服务
  if err = master.InitApiServer(); err != nil {
    goto ERR
  }

  // 正常退出
  for {
    time.Sleep(1 * time.Second)
  }

  return

ERR:
  fmt.Println(err)

}
