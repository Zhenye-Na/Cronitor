// 页面加载完成后, 回调函数
$(document).ready(function () {
  // 时间格式化函数
  function timeFormat(millsecond) {
    // 前缀补0: 2018-08-07 08:01:03.345
    function paddingNum(num, n) {
      var len = num.toString().length;
      while (len < n) {
        num = "0" + num;
        len++;
      }
      return num;
    }

    var date = new Date(millsecond);
    var year = date.getFullYear();
    var month = paddingNum(date.getMonth() + 1, 2);
    var day = paddingNum(date.getDate(), 2);
    var hour = paddingNum(date.getHours(), 2);
    var minute = paddingNum(date.getMinutes(), 2);
    var second = paddingNum(date.getSeconds(), 2);
    var millsecond = paddingNum(date.getMilliseconds(), 3);

    return (
      year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second + "." + millsecond
    );
  }

  // 1. 绑定按钮的事件处理函数
  // 用 javascript 委托机制, DOM事件冒泡的一个关键原理

  // 编辑任务
  $("#job-list").on("click", ".edit-job", function (event) {
    // 取当前 job 的信息, 赋值给模态框的 input
    $("#edit-name").val(
      $(this).parents("tr").children(".job-name").text()
    );
    $("#edit-command").val(
      $(this).parents("tr").children(".job-command").text()
    );
    $("#edit-cronExpr").val(
      $(this).parents("tr").children(".job-cronExpr").text()
    );
    // 弹出模态框
    $("#edit-modal").modal("show");
  });

  // 删除任务
  $("#job-list").on("click", ".delete-job", function (event) {
    // javascript bind  --> this 是 delete 这个 button 按钮
    var jobName = $(this).parents("tr").children(".job-name").text();
    $.ajax({
      url: "/job/delete",
      type: "post",
      dataType: "json",
      data: { name: jobName },
      complete: function () {
        window.location.reload();
      },
    });
  });

  // 杀死任务
  $("#job-list").on("click", ".kill-job", function (event) {
    var jobName = $(this).parents("tr").children(".job-name").text();
    $.ajax({
      url: "/job/kill",
      type: "post",
      dataType: "json",
      data: { name: jobName },
      complete: function () {
        window.location.reload();
      },
    });
  });

  // 保存任务
  $("#save-job").on("click", function () {
    var jobInfo = {
      name: $("#edit-name").val(),
      command: $("#edit-command").val(),
      cronExpr: $("#edit-cronExpr").val(),
    };
    $.ajax({
      url: "/job/save",
      type: "post",
      dataType: "json",
      data: { job: JSON.stringify(jobInfo) },
      complete: function () {
        window.location.reload();
      },
    });
  });

  // 新建任务
  $("#new-job").on("click", function () {
    $("#edit-name").val("");
    $("#edit-command").val("");
    $("#edit-cronExpr").val("");
    $("#edit-modal").modal("show");
  });

  // 查看任务日志
  $("#job-list").on("click", ".log-job", function (event) {
    // 清空日志列表
    $("#log-list tbody").empty();

    // 获取任务名
    var jobName = $(this).parents("tr").children(".job-name").text();

    // 请求 `/job/log` 接口
    $.ajax({
      url: "/job/log",
      dataType: "json",
      data: { name: jobName },
      success: function (resp) {
        if (resp.errno != 0) {
          return;
        }
        // 遍历日志
        var logList = resp.data;
        for (var i = 0; i < logList.length; ++i) {
          var log = logList[i];
          var tr = $("<tr>");
          tr.append($("<td>").html(log.command));
          tr.append($("<td>").html(log.err));
          tr.append($("<td>").html(log.output));
          tr.append($("<td>").html(timeFormat(log.planTime)));
          tr.append($("<td>").html(timeFormat(log.scheduleTime)));
          tr.append($("<td>").html(timeFormat(log.startTime)));
          tr.append($("<td>").html(timeFormat(log.endTime)));
          console.log(tr);
          $("#log-list tbody").append(tr);
        }
      },
    });

    // 弹出模态框
    $("#log-modal").modal("show");
  });

  // 健康节点按钮
  $("#list-worker").on("click", function () {
    // 清空现有 table
    $("#worker-list tbody").empty();

    // 拉取节点
    $.ajax({
      url: "/worker/list",
      dataType: "json",
      success: function (resp) {
        if (resp.errno != 0) {
          return;
        }

        var workerList = resp.data;
        // 遍历每个 IP, 添加到模态框的 table 中
        for (var i = 0; i < workerList.length; ++i) {
          var workerIP = workerList[i];
          var tr = $("<tr>");
          tr.append($("<td>").html(workerIP));
          $("#worker-list tbody").append(tr);
        }
      },
    });

    // 弹出模态框
    $("#worker-modal").modal("show");
  });

  // 2. 定义一个函数, 用于刷新任务列表
  function rebuildJobList() {
    // 请求 `/job/list`
    $.ajax({
      url: "/job/list",
      dataType: "json",
      success: function (resp) {
        if (resp.errno != 0) {
          // 服务端出错了
          return;
        }
        // 任务数组
        var jobList = resp.data;
        // 清理列表
        $("#job-list tbody").empty();
        // 遍历任务, 填充table
        for (var i = 0; i < jobList.length; ++i) {
          var job = jobList[i];
          var tr = $("<tr>");
          tr.append($('<td class="job-name">').html(job.name));
          tr.append($('<td class="job-command">').html(job.command));
          tr.append($('<td class="job-cronExpr">').html(job.cronExpr));
          var toolbar = $('<div class="btn-toolbar">')
            .append('<button class="btn btn-info edit-job">编辑</button>')
            .append('<button class="btn btn-danger delete-job">删除</button>')
            .append('<button class="btn btn-warning kill-job">强杀</button>')
            .append('<button class="btn btn-success log-job">日志</button>');
          tr.append($("<td>").append(toolbar));
          $("#job-list tbody").append(tr);
        }
      },
    });
  }
  rebuildJobList();
});
