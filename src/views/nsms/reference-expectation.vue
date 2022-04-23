<template>
  <basic-container>
      <avue-crud :option="expectationOption"
                 :table-loading="expectationLoading"
                 :data="expectationData"
                 :page="expectationPage"
                 :permission="permissionList"
                 :before-open="beforeOpen"
                 v-model="expectationForm"
                 ref="crud"
                 @row-update="rowUpdate"
                 @row-save="rowSave"
                 @row-del="rowDel"
                 @search-change="searchChange"
                 @search-reset="searchReset"
                 @selection-change="selectionChange"
                 @current-change="currentChange"
                 @size-change="sizeChange"
                 @on-load="onLoad">
        <template slot="menuLeft">
          <el-button type="primary"
                     size="small"
                     icon="el-icon-add"
                     plain
                     v-if="permission.expectation_add&&(state==1)"
                     @click="addExpectation">添 加 排 班 期 望
          </el-button>
          <el-button type="danger"
                     size="small"
                     icon="el-icon-delete"
                     plain
                     v-if="permission.expectation_delete&&(state==1)"
                     @click="handleDelete">删 除
          </el-button>
        </template>

        <template slot-scope="{row,index}" slot="menu">
          <el-button type="primary"
                     size="small"
                     icon="el-icon-view"
                     v-if="permission.expectation_view"
                     @click="viewExpectation(row)">查 看
          </el-button>
          <el-button type="warning"
                     size="small"
                     icon="el-icon-edit"
                     v-if="permission.expectation_add&&(state==1)"
                     @click="updateExpectation(row)">编 辑
          </el-button>
          <el-button type="danger"
                     size="small"
                     icon="el-icon-del"
                     v-if="permission.expectation_view&&(state==1)"
                     @click="rowDel(row)">删 除
          </el-button>
        </template>
      </avue-crud>

      <el-dialog id="approval-form"
                 :title="dialogTitle"
                 size="1200px"
                 append-to-body
                 :destroy-on-close="true"
                 @close="handleDialogClose"
                 :visible.sync="dialogVisible">

        <avue-form v-if="dialogVisible" :option="expectationOption" v-model="expectationForm" ref="formMain">
          <template slot-scope="scope" slot="menuForm">
            <el-button type="success" size="mini" icon="el-icon-success"
                       v-if="addOrUpdateDialog"
                       @click="handleSubmit"
            >提 交 保 存
            </el-button>
            <el-button size="mini" icon="el-icon-close"
                       @click="dialogVisible=false"
            > 退 出
            </el-button>
          </template>
        </avue-form>


      </el-dialog>

  </basic-container>
</template>

<script>
import {add, getDetail, getList, getPriority, remove, update} from "@/api/nsms/expectation";
import {mapGetters} from "vuex";
import {select} from "@/api/nsms/schedulingreference";

import dayjs from "dayjs";

export default {
    name:"reference-expectation",
    props: ['referenceSid','state'],
    data() {
      //对于校验，必须要有所有情况下的callback();不然会出现无法提交的情况，而且这种异常没有报错
      var validateRequire = (rule, value, callback)=>  {
        if (this.expectationForm.expectationType!==0&&this.expectationForm.expectationType!==1){
          if (value.length!=2) {
            callback(new Error('请选择时间区间'));
          }
          //判断是否再排班时间区间内
          if (dayjs(value[0]).isBefore(this.referenceDateRange[0])
            ||dayjs(value[1]).isAfter(this.referenceDateRange[1])){
            callback(new Error('请选择正确的时间区间'));
          }
          //最后将数值同时赋值为时间区间
          var number=dayjs(this.expectationForm.dateRange[1]).diff(this.expectationForm.dateRange[0],"day")
          //number为日期之间的差，需要+1
          this.expectationForm.dayNumber=number+1;
          callback();
        }else {
          //对于天数期望，默认时间区间都是排班区间
          if (this.expectationForm.dateRange[0]!==this.referenceDateRange[0]&&
          this.expectationForm.dateRange[1]!==this.referenceDateRange[1]){
            this.expectationForm.dateRange[0]=this.referenceDateRange[0];
            this.expectationForm.dateRange[1]=this.referenceDateRange[1];
            // this.$message.error('天数期望，时间区间都是排班区间！');
            callback(new Error('天数期望，时间区间都是排班区间！'));
          }
          callback();
        }
      };
      var validateDayNumber = (rule, value, callback)=>  {
        if (value<=0){
          callback(new Error('请输入至少大于等于1的数字'));
        }
        //先判断是哪种类型的排班期望
        if (this.expectationForm.expectationType!==0&&this.expectationForm.expectationType!==1){
          //如果不是天数期望，那么天数必须要等于期望区间的天数
          // console.log(this.expectationForm,"this ex2222")
          let number=dayjs(this.expectationForm.dateRange[1]).diff(this.expectationForm.dateRange[0],"day");
          //number为日期之间的差，需要+1
          // console.log("number1",number,"number1")
          number=number+1;
          // console.log(number,"number2")
          if (value!=number){
            this.expectationForm.dayNumber=number;
            // this.$message.warning('天数必须要等于期望区间的天数');
            callback(new Error('天数必须要等于期望区间的天数: '+number));
          }
          //完成校验后，全部符合，记得 callback(); 结束校验
          callback();
        }else {
          //如果是天数期望，那么它的天数只需要在排班期间内即可
          let number=dayjs(this.referenceDateRange[1]).diff(this.referenceDateRange[0],"day")
          //number为日期之间的差，需要+1
          number=number+1;
          if (value>=number){
            callback(new Error("天数必须要小于等于"+number));
          }
          //完成校验后，全部符合，记得 callback(); 结束校验
          callback();
        }

      };
      return {
        expectationForm: {},
        query: {},
        expectationLoading: true,
        expectationPage: {
          pageSize: 10,
          currentPage: 1,
          total: 0
        },
        selectionList: [],
        // 用来校验时间区间
        referenceDateRange:[],
        dialogTitle:'',
        dialogVisible:false,
        viewDialog:false,
        addOrUpdateDialog:false,
        delBtn:false,
        emptyText: '暂无数据',
        expectationOption: {
          menuWidth:"380",
          height: 'auto',
          calcHeight: 210,
          searchShow: true,
          searchMenuSpan: 6,
          tip: false,
          border: true,
          index: true,
          viewBtn: false,
          editBtn:false,
          addBtn:false,
          delBtn:false,
          selection: true,
          column: [
            {
              label: "对应的排班依据表",
              prop: "referenceSid",
              labelWidth:160,
              hide:true,
              disabled:true,
              span:24,
              type: "select",
              dicData:[],
              // dicUrl: "/api/nsms/schedulingreference/select",
              props: {
                label: 'title',
                value: 'id'
              },
              rules: [{
                required: true,
                message: "请输入对应的排班依据表id",
                trigger: "blur"
              }]
            },
            {
              label: "申请人",
              prop: "nurseSid",
              type: "select",
              dicUrl: "/api/nsms/nurseinfo/selectAllCo",
              props: {
                label: 'name',
                value: 'id'
              },
              display:false,
            },
            {
              label: "期望类型",
              prop: "expectationType",
              type: "select",
              dicUrl: "/api/blade-system/dict/dictionary?code=expectation_type",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              rules: [{
                required: true,
                message: "请输入期望类型",
                trigger: "blur"
              }]
            },
            {
              label: "优先级",
              prop: "priority",
              disabled:true,
              rules: [{
                required: true,
                message: "请输入优先级",
                trigger: "blur"
              }]
            },
            {
              label: "日期范围",
              prop: "dateRange",
              span:24,
              type: "daterange",
              format:'yyyy-MM-dd',
              valueFormat:'yyyy-MM-dd',
              startPlaceholder: '请选择排班时间区间的时间',
              endPlaceholder: '请选择排班时间区间的时间',
              pickerOptions: {
                disabledDate(time) {
                  return time.getTime() < Date.now();
                },
              },
              rules: [
                { validator: validateRequire, trigger: 'blur' },
                {
                  required: true,
                  message: "请选择时间区间",
                  trigger: "blur"
                }],

            },
            {
              label: "天数",
              prop: "dayNumber",
              type: "number",
              rules: [{
                required: true,
                message: "请输入天数",
                trigger: "blur"
              },
                { validator: validateDayNumber, trigger: 'blur' }
              ]
            },
            {
              label: "实现状态",
              prop: "actualState",
              type: "select",
              display:false,
              dicUrl: "/api/blade-system/dict/dictionary?code=actual_state",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
            },
          ]
        },
        expectationData: []
      };
    },
    watch:{
      // 'expectationForm.expectationType' : {
      //   handler(newValue,oldValue){
      //     //判断是否是数值初始化
      //     if (newValue!=null){
      //       // expectationType : 0、1为天数，显示默认排班时间区间
      //       if (newValue===0||newValue===1){
      //         this.expectationForm.dateRange=this.referenceDateRange;
      //         // const number=dayjs(this.referenceDateRange[1]).diff(this.referenceDateRange[0],"day")
      //         // this.expectationForm.dayNumber=number;
      //       }else {
      //         this.expectationForm.dateRange=[];
      //         // this.expectationForm.dayNumber=0;
      //       }
      //     }
      //   },
      //   immediate:false, // watch侦听操作内的函数不会立刻被执行
      // },
      // 'expectationForm.dateRange' : {
      //   handler(newValue, oldValue) {
      //     if (newValue!=null&&newValue.length===2){
      //       //number为日期之间的差，需要+1
      //       const number=dayjs(newValue[1]).diff(newValue[0],"day");
      //       this.expectationForm.dayNumber=number+1;
      //     }
      //   },
      //   immediate:false, // watch侦听操作内的函数不会立刻被执行
      // },
    },
    computed: {
      ...mapGetters(["permission"]),
      permissionList() {
        return {
          addBtn: this.vaildData(this.permission.expectation_add, false),
          viewBtn: this.vaildData(this.permission.expectation_view, false),
          delBtn: this.vaildData(this.permission.expectation_delete, false),
          editBtn: this.vaildData(this.permission.expectation_edit, false)
        };
      },
      ids() {
        let ids = [];
        this.selectionList.forEach(ele => {
          ids.push(ele.id);
        });
        return ids.join(",");
      },
    },
    created() {
      this.init();
    },
    methods: {
      init(){
        //资源初始化
        select().then(res=>{
          const column = this.findObject(this.expectationOption.column, 'referenceSid');
          column.dicData = res.data.data;
          column.dicData.forEach(x=>{
            if (x.id===this.referenceSid){
              this.referenceDateRange=x.dateRange;
              return;
            }
          })
        })
      },
      viewExpectation(row){
        this.dialogTitle="查看排班期望";
        //布局初始化，通过不同类型的期望显示不同的字段。同时提交验证也需要针对性适应
        this.dialogVisible=true;
        this.viewDialog=true;
        this.addOrUpdateDialog=false;
        //取消显示默认提交按钮
        this.expectationOption.submitBtn=false;
        this.expectationOption.emptyBtn=false;
        //禁止编辑
        let expectationType = this.findObject(this.expectationOption.column, 'expectationType');
        expectationType.disalbed=true;
        //todo 无法通过配置解决 daterange disalbed 的问题，可能需要对详情显示界面重新设计以 date 形式显示
        // let dataRange = this.findObject(this.expectationOption.column, 'dataRange');
        // dataRange.disalbed=true;
        let dayNumber = this.findObject(this.expectationOption.column, 'dayNumber');
        dayNumber.disalbed=true;
        getDetail(row.id).then(res=>{
          this.expectationForm=res.data.data;
        })
      },
      updateExpectation(row){
        this.dialogTitle="编辑排班期望";
        //布局初始化，通过不同类型的期望显示不同的字段。同时提交验证也需要针对性适应
        this.dialogVisible=true;
        this.addOrUpdateDialog=true;
        this.viewDialog=false;
        //取消显示默认提交按钮
        this.expectationOption.submitBtn=false;
        this.expectationOption.emptyBtn=false;
        //在数据更新前改变监听赋值
        getDetail(row.id).then(res=>{
          this.expectationForm=res.data.data;
        })
      },
      addExpectation(){
        //布局初始化，通过不同类型的期望显示不同的字段。同时提交验证也需要针对性适应
        this.dialogVisible=true;
        this.addOrUpdateDialog=true;
        this.viewDialog=false;
        this.dialogTitle="添加排班期望";
        //取消显示默认提交按钮
        this.expectationOption.submitBtn=false;
        this.expectationOption.emptyBtn=false;
        let id=this.referenceSid;
        getPriority(id).then(res=>{
          this.expectationForm.priority=res.data.data;
        })
        this.expectationForm.referenceSid=this.referenceSid;
      },
      handleDialogClose(){
        //关闭窗口
        this.dialogVisible=false;
        this.dialogTitle="";
        this.expectationForm={}
        //清除状态
        this.expectationOption.submitBtn=true;
        this.expectationOption.emptyBtn=true;
        if (this.viewDialog){
          //恢复可编辑状态
          let expectationType = this.findObject(this.expectationOption.column, 'expectationType');
          expectationType.disalbed=false;
          // let dataRange = this.findObject(this.expectationOption.column, 'dataRange');
          // dataRange.disalbed=false;
          let dayNumber = this.findObject(this.expectationOption.column, 'dayNumber');
          dayNumber.disalbed=false;
        }
        this.addOrUpdateDialog=false;
        this.viewDialog=false;
        //刷新
        this.onLoad(this.expectationPage);
      },
      handleSubmit(){
        this.$refs.formMain.validate(valid => {
          if (valid){
            let data=this.expectationForm;
            add(data).then(() => {
              // this.formOnLoading = false;
              //关闭弹窗
              // this.handleDialogClose();
              this.dialogVisible=false;
              this.$message({type: 'success', message: '操作成功!'});
            }, error => {
              this.$message.error('业务出错！');
              // console.log(error);
            });
          }else {
            this.$message({message:"请检查必填项",type:"warning",customClass:'topToDialogIndex'});
          }
        })
      },
      rowSave(row, done, loading) {
        add(row).then(() => {
          done();
          this.onLoad(this.expectationPage);
          this.$message({
            type: "success",
            message: "操作成功!"
          });
        }, error => {
          window.console.log(error);
          loading();
        });
      },
      rowUpdate(row, index, done, loading) {
        update(row).then(() => {
          done();
          this.onLoad(this.expectationPage);
          this.$message({
            type: "success",
            message: "操作成功!"
          });
        }, error => {
          window.console.log(error);
          loading();
        });
      },
      rowDel(row) {
        this.$confirm("确定将选择数据删除?", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        })
          .then(() => {
            return remove(row.id);
          })
          .then(() => {
            this.onLoad(this.expectationPage);
            this.$message({
              type: "success",
              message: "操作成功!"
            });
          });
      },
      handleDelete() {
        if (this.selectionList.length === 0) {
          this.$message.warning("请选择至少一条数据");
          return;
        }
        this.$confirm("确定将选择数据删除?", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        })
          .then(() => {
            return remove(this.ids);
          })
          .then(() => {
            this.onLoad(this.expectationPage);
            this.$message({
              type: "success",
              message: "操作成功!"
            });
            this.$refs.crud.toggleSelection();
          });
      },
      beforeOpen(done, type) {
        if (["edit", "view"].includes(type)) {
          getDetail(this.expectationForm.id).then(res => {
            this.expectationForm = res.data.data;
          });
        }
        done();
      },
      searchReset() {
        this.query = {};
        this.onLoad(this.expectationPage);
      },
      searchChange(params, done) {
        this.query = params;
        this.expectationPage.currentPage = 1;
        this.onLoad(this.expectationPage, params);
        done();
      },
      selectionChange(list) {
        this.selectionList = list;
      },
      selectionClear() {
        this.selectionList = [];
        this.$refs.crud.toggleSelection();
      },
      currentChange(currentPage){
        this.expectationPage.currentPage = currentPage;
      },
      sizeChange(pageSize){
        this.expectationPage.pageSize = pageSize;
      },
      onLoad(page, params = {}) {
        this.expectationLoading = true;
        // 添加筛选条件
        this.query["referenceSid"]=this.referenceSid;

        getList(page.currentPage, page.pageSize, Object.assign(params, this.query)).then(res => {
          const data = res.data.data;
          this.expectationPage.total = data.total;
          this.expectationData = data.records;
          this.expectationLoading = false;
          this.selectionClear();
        });
      }
    }
  };
</script>

<style>
.topToDialogIndex{
  z-index: 3000 !important;
}
</style>
