package master

import (
	"encoding/json"
	"go-crontab/source/crontab/common"
	"net"
	"net/http"
	"strconv"
	"time"
)

// 任务的 http 接口
type ApiServer struct {
	httpServer http.Server
}

var (
	// 单例对象
	G_apiServer *ApiServer
)

/**
 * handleJobSave 保存任务接口
 */
func handleJobSave(resp http.ResponseWriter, req *http.Request) {
	var (
		err     error
		postJob string
		job     common.Job
		oldJob  *common.Job
		bytes   []byte
	)

	// 1. 解析 POST 表单
	if err = req.ParseForm(); err != nil {
		goto ERR
	}

	// 2. 取表单中的 job 字段
	postJob = req.PostForm.Get("job")

	// 3. 反序列化 job
	if err = json.Unmarshal([]byte(postJob), &job); err != nil {
		goto ERR
	}

	// 4. 保存到 etcd
	if oldJob, err = G_jobMgr.SaveJob(&job); err != nil {
		goto ERR
	}

	// 5. 返回正常应答 ({"errno": 0, "msg": "", "data": {....}})
	if bytes, err = common.BuildResponse(0, "success", oldJob); err == nil {
		resp.Write(bytes)
	}

	return

ERR:
	// 6. 返回异常应答
	if bytes, err = common.BuildResponse(-1, err.Error(), nil); err == nil {
		resp.Write(bytes)
	}
}

// 删除任务接口
// POST /job/delete   name=job1
func handleJobDelete(resp http.ResponseWriter, req *http.Request) {
	var (
		err    error // interface{}
		name   string
		oldJob *common.Job
		bytes  []byte
	)

	// POST:   a=1&b=2&c=3
	if err = req.ParseForm(); err != nil {
		goto ERR
	}

	// 删除的任务名
	name = req.PostForm.Get("name")

	// 去删除任务
	if oldJob, err = G_jobMgr.DeleteJob(name); err != nil {
		goto ERR
	}

	// 正常应答
	if bytes, err = common.BuildResponse(0, "success", oldJob); err == nil {
		resp.Write(bytes)
	}
	return

ERR:
	if bytes, err = common.BuildResponse(-1, err.Error(), nil); err == nil {
		resp.Write(bytes)
	}
}

/**
 * InitApiServer 初始化服务
 */
func InitApiServer() (err error) {
	var (
		mux        *http.ServeMux
		listener   net.Listener
		httpServer *http.Server
	)

	// 配置路由
	mux = http.NewServeMux()
	mux.HandleFunc("/job/save", handleJobSave)
	mux.HandleFunc("/job/delete", handleJobDelete)
	mux.HandleFunc("/job/list", handleJobList)

	// TCP listening
	if listener, err = net.Listen("tcp", ":"+strconv.Itoa(G_config.ApiPort)); err != nil {
		return
	}

	// HTTP service
	httpServer = &http.Server{
		ReadTimeout:  time.Duration(G_config.ApiReadTimeout) * time.Millisecond,
		WriteTimeout: time.Duration(G_config.ApiWriteTimeout) * time.Millisecond,
		Handler:      mux,
	}

	G_apiServer = &ApiServer{
		httpServer: httpServer,
	}

	// start server
	go httpServer.Serve(listener)

}

// 列举所有crontab任务
func handleJobList(resp http.ResponseWriter, req *http.Request) {
	var (
		jobList []*common.Job
		bytes   []byte
		err     error
	)

	// 获取任务列表
	if jobList, err = G_jobMgr.ListJobs(); err != nil {
		goto ERR
	}

	// 正常应答
	if bytes, err = common.BuildResponse(0, "success", jobList); err == nil {
		resp.Write(bytes)
	}
	return

ERR:
	if bytes, err = common.BuildResponse(-1, err.Error(), nil); err == nil {
		resp.Write(bytes)
	}
}
