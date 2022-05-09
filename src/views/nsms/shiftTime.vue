<template>
  <basic-container
    v-loading="containerLoading"
    element-loading-text="获取数据中..."
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(0, 0, 0, 0.8)">
    <FullCalendar ref="fullCalendar"  :options="calendarOptions" />
  </basic-container>
</template>


<script src='@fullcalendar/core/main.js'></script>
<script src='@fullcalendar/core/locales-all.js'></script>
<script>
import '@fullcalendar/core/vdom' // solves problem with Vite
import FullCalendar from '@fullcalendar/vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { formatDate } from '@fullcalendar/vue';
import {calendar, calenderDefault} from "@/api/nsms/stafftime";
import dayjs from "dayjs";

export default {
  components: {
    FullCalendar // make the <FullCalendar> tag available
  },
  data() {
    return {
      containerLoading:false,
      calendarOptions: {
        events: function(fetchInfo, successCallback, failureCallback) {
          calenderDefault(
            fetchInfo.start,
            fetchInfo.end,
            fetchInfo.timeZone
          ).then(function (res) {
            successCallback(res.data.data)
          });
        },
        // events: [],
        plugins: [ dayGridPlugin, interactionPlugin ],
        initialView: 'dayGridMonth',
        // dateClick: this.handleDateClick,
        // eventClick:this.handleEventClick,
        eventOrder:["category","postType"],
        // eventLimit: true, // for all non-agenda views
        // views: {
        //   agenda: {
        //     eventLimit: 6 // adjust to 6 only for agendaWeek/agendaDay
        //   }
        // },
        // eventLimitClick:"popover",
        // editable:true,
        eventDrop:this.changeShiftDate,
        // eventLimitClick:"day",
        // buttonIcons:false,
        headerToolbar: {
          start: 'title', // will normally be on the left. if RTL, will be on the right
          center: '',
          end: 'today prev,next' // will normally be on the right. if RTL, will be on the left
        },
        buttonText:{
          today:"返回当前",
          prev:"<上个月",
          next:"下个月>",
        },
        locale:'zh-cn',//本地化翻译
      }
    }
  },
  created() {
    //弹出加载弹窗，仅当服务完成后才退出
    // this.containerLoading=true;
    // this.today=dayjs().format("YYYY-MM-DD");
    // this.dateTitleFormat(this.today);
    // calendar(this.today).then(res=>{
    //   this.calendarOptions.events=res.data.data;
    //   //弹出加载弹窗，仅当服务完成后才退出
    //   this.containerLoading=false;
    // })
  },
  methods:{
    handleDateClick: function(arg) {
      alert('date click! ' , arg.dateStr)
    },
    // handleEventClick:function (calEvent, jsEvent, view) {
    //   // calEvent 是 Event Object 对象，包含了日程的信息（例如日期，标题等）
    //   alert('date click! ')
    // },
    changeShiftDate(vent, delta, revertFunc){
      // event是 Event Object 对象，包含当前日程的信息（时间，标题等）
      // delta 表示事件被移动的时间量
      // revertFunc 是一个函数，如果被调用的话，日程会恢复到拖拽前的时间（就是被还原），当ajax失败的时候比较有用。
      alert('date change! ' )

    }
  },
}
</script>


<style scoped>

</style>
