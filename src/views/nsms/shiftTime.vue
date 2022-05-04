<template>
  <basic-container>
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
import {calendar} from "@/api/nsms/stafftime";
import dayjs from "dayjs";

export default {
  components: {
    FullCalendar // make the <FullCalendar> tag available
  },
  data() {
    return {
      calendarOptions: {
        themeSystem: 'bootstrap3',
        plugins: [ dayGridPlugin, interactionPlugin ],
        initialView: 'dayGridMonth',
        header: {
          center: 'month,agendaFourDay' // buttons for switching between views
        },
        dateClick: this.handleDateClick,
        // eventClick:this.handleEventClick,
        eventOrder:["category","post_type"],
        eventLimit: true, // for all non-agenda views
        views: {
          agenda: {
            eventLimit: 6 // adjust to 6 only for agendaWeek/agendaDay
          }
        },
        eventLimitClick:"popover",
        editable:true,
        eventDrop:this.changeShiftDate,
        // eventLimitClick:"day",
        customButtons: {
          myCustomButton: {
            text: '自定义按钮',
            click: function() {
              alert('点击了自定义按钮!');
            }
          }
        },
        // header: {
        //   left:   'title',
        //   center: 'myCustomButton',
        //   right:  'today prev,next'
        // },
        locale:'zh',//本地化翻译
        events: [
          { title: '张三', date: '2022-04-01',color:'#483D8B',type:0,nurseType:11},
          { title: '张三', date: '2022-04-02',color: '#483D8B' ,type:0,nurseType:11},
          { title: '里斯', date: '2022-04-01',color: '#483D8B' ,type:0,nurseType:11},
          { title: '里斯', date: '2022-04-02',color: '#483D8B',type:0,nurseType:11},
          { title: '王五', date: '2022-04-01' ,color: '#483D8B',type:0,nurseType:11},
          { title: '王五', date: '2022-04-02' ,color: '#483D8B',type:0,nurseType:11},
          { title: 'YY', date: '2022-04-01' ,color: '#483D8B',type:0,nurseType:11},
          { title: 'YY', date: '2022-04-02' ,color: '#483D8B',type:0,nurseType:11},
          { title: 'ZZ', date: '2022-04-01' ,color: '#483D8B',type:0,nurseType:11},
          { title: 'ZZ', date: '2022-04-02' ,color: '#483D8B',type:0,nurseType:11},
          { title: 'CC', date: '2022-04-01' ,color: '#483D8B',type:0,nurseType:11},
          { title: 'CC', date: '2022-04-02' ,color: '#483D8B',type:0,nurseType:11},
          { title: '张三风', date: '2022-04-01',type: 1,nurseType:22},
          { title: '张三风', date: '2022-04-03',type: 1,nurseType:22},
          { title: '戴斯', date: '2022-04-01',type: 1,nurseType:22},
          { title: '戴斯', date: '2022-04-03',type: 1,nurseType:22},
          { title: '七七', date: '2022-04-01',type: 1,nurseType:22},
          { title: '七七', date: '2022-04-02',type: 1,nurseType:22},
          { title: '么么', date: '2022-04-01',type: 1,nurseType:22},
          { title: '么么', date: '2022-04-03',type: 0,nurseType:22,color: '#483D8B'},
          { title: '月月', date: '2022-04-01',type: 1,nurseType:22},
          { title: '月月', date: '2022-04-03',type: 0,nurseType:22,color: '#483D8B'},
          { title: '悦悦', date: '2022-04-01',type: 1,nurseType:22},
          { title: '悦悦', date: '2022-04-03',type: 0,nurseType:22,color: '#483D8B'}
        ]
      }
    }
  },
  created() {
    calendar(dayjs( ).format("YYYY-MM-DD")).then(res=>{
      this.calendarOptions.events=res.data.data;
    })
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
