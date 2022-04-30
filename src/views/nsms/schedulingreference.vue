<template>
  <basic-container>
    <avue-crud :option="option"
               :table-loading="loading"
               :data="data"
               :page="page"
               :permission="permissionList"
               :before-open="beforeOpen"
               v-model="form"
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
<!--        <el-button type="danger"-->
<!--                   size="small"-->
<!--                   icon="el-icon-delete"-->
<!--                   plain-->
<!--                   v-if="permission.schedulingreference_delete"-->
<!--                   @click="handleDelete">删 除-->
<!--        </el-button>-->
        <el-button type="primary"
                   size="small"
                   icon="el-icon-s-check"
                   plain
                   v-if="permission.schedulingreference_check"
                   @click="checkReference">配置开关
        </el-button>
        <el-button type="warning"
                   size="small"
                   icon="el-icon-coordinate"
                   plain
                   v-if="permission.schedulingreference_recheck"
                   @click="recheckReference">排班结果状态反审
        </el-button>
      </template>

      <template slot-scope="{row,index}" slot="menu">
        <el-button
          type="text"
          class="button-text"
          icon="el-icon-view"
          size="mini"
          plain
          @click="$refs.crud.rowView(row,index)"
          v-if="permission.schedulingreference_view"
        >查看
        </el-button>
        <el-button
          type="text"
          class="button-text"
          icon="el-icon-view"
          size="mini"
          plain
          @click="$refs.crud.rowEdit(row,index)"
          v-if="permission.schedulingreference_edit&&row.state==0"
        >编辑
        </el-button>
        <el-button
          type="text"
          class="button-text"
          icon="el-icon-view"
          size="mini"
          plain
          @click="$refs.crud.rowDel(row)"
          v-if="permission.schedulingreference_delete&&row.state==0"
        >删除
        </el-button>
        <el-button type="warning"
                   size="small"
                   icon="el-icon-view"
                   plain
                   v-if="permission.schedulingreference_scheduling&&row.state==2"
                   @click="scheduling(row)">生 成 排 班 结 果
        </el-button>
      </template>

      <template slot="state" slot-scope="{row}">
        <el-tag effect="plain" type="info" v-show="row.state==0">未启用</el-tag>
        <el-tag effect="plain" type="primary" v-show="row.state==1">期望录入</el-tag>
        <el-tag effect="plain" type="warning" v-show="row.state==2">待排班</el-tag>
        <el-tag effect="plain" type="danger" v-show="row.state==3">排班失败</el-tag>
        <el-tag effect="plain" type="success" v-show="row.state==4">排班完成</el-tag>
      </template>

    </avue-crud>


    <el-dialog
      id="approval-form"
      :title="dialogTitle"
      size="1200px"
      append-to-body
      :destroy-on-close="true"
      @close="handleDrawerClose"
      :visible.sync="dialogVisible">

      <avue-form v-if="dialogVisible" :option="option" v-model="form" ref="formMain">
        <template slot-scope="scope" slot="menuForm">
          <div v-if="dialogType==='check'">
            <el-button type="primary" size="mini" icon="el-icon-success"
                       v-if="permission.schedulingreference_check"
                       @click="handleCheckSubmit('ready')">准备排班
            </el-button>
            <el-button type="success" size="mini" icon="el-icon-success"
                       v-if="permission.schedulingreference_check"
                       @click="handleCheckSubmit('on')">启用
            </el-button>
            <el-button type="warning" size="mini" icon="el-icon-success"
                       v-if="permission.schedulingreference_check"
                       @click="handleCheckSubmit('off')">关闭
            </el-button>
            <el-button size="mini" icon="el-icon-close"
                       @click="dialogVisible = false">退出状态审核
            </el-button>
          </div>
          <div v-if="dialogType==='recheck'">
            <el-button size="mini" icon="el-icon-close" round type="danger"
                       v-if="permission.schedulingreference_recheck"
                       @click="handleRecheckSubmit">撤销排班结果
            </el-button>
            <el-button size="mini" icon="el-icon-close" round
                       @click="dialogVisible = false">退出排班结果状态反审
            </el-button>
          </div>
        </template>
      </avue-form>
    </el-dialog>

    <el-dialog
      v-if="schedulingLoadingDialogVisible">
      <div v-loading="schedulingLoading">

      </div>
    </el-dialog>
  </basic-container>
</template>

<script>
import {
  getList,
  getDetail,
  add,
  update,
  remove,
  changeState,
  recheckState,
  scheduling
} from "@/api/nsms/schedulingreference";
  import {mapGetters} from "vuex";
import dayjs from "dayjs";

  export default {
    data() {
      var validateDayNumber = (rule, value, callback)=>  {
        if (value<=0){
          callback(new Error('请输入至少大于等于1的数字'));
        }
        if (this.form.dateRange.length!==2){
          callback(new Error('请先选择排班区间'));
        }
        let number=dayjs(this.form.dateRange[1]).diff(this.form.dateRange[0],"day");
        //number为日期之间的差，需要+1
        // console.log("number1",number,"number1")
        number=number+1;
        if (value>=number){
          callback(new Error('天数必须要小于期望区间的天数: '+number));
        }
        //完成校验后，全部符合，记得 callback(); 结束校验
        callback();
      };
      return {
        form: {},
        // 用来初始化新建表单的默认值
        defaultFrom:{
          nightNurseNumber:2,
          nightAssistantNumber:1,
          dayNurseNumber:4,
          dayAssistantNumber:2,
        },
        query: {},
        loading: true,
        page: {
          pageSize: 10,
          currentPage: 1,
          total: 0
        },
        selectionList: [],
        dialogVisible:false,
        dialogTitle:"",
        dialogType:"",
        option: {
          height: 'auto',
          calcHeight: 210,
          searchShow: true,
          searchMenuSpan: 6,
          tip: false,
          border: true,
          index: true,
          viewBtn: false,
          editBtn:false,
          delBtn:false,
          selection: true,
          column: [
            {
              label: "科室编号",
              prop: "departmentId",
              type: "tree",
              dicData: [],
              dicUrl: "/api/blade-system/dept/tree",
              // 新增时不显示
              addDisplay:false,
              editDisplay:false,
              viewDisplay:false,
              props: {
                label: 'title',
                value: 'key'
              },
              rules: [{
                required: true,
                message: "请输入科室编号",
                trigger: "blur"
              }]
            },
            {
              label: "日期范围",
              prop: "dateRange",
              type: "daterange",
              format:'yyyy-MM-dd',
              valueFormat:'yyyy-MM-dd',
              startPlaceholder: '日期开始范围自定义',
              endPlaceholder: '日期结束范围自定义',
              pickerOptions: {
                disabledDate(time) {
                  return time.getTime() < Date.now();
                },
                shortcuts: [{
                  text: '一周',
                  onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    end.setTime(end.getTime() + 3600 * 1000 * 24 * 7);
                    picker.$emit('pick', [start, end]);
                  }
                }, {
                  text: '一个月',
                  onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    end.setTime(end.getTime() + 3600 * 1000 * 24 * 30);
                    picker.$emit('pick', [start, end]);
                  }
                }]
              },
              rules: [{
                required: true,
                message: "请选择排班时间区间",
                trigger: "blur"
              }]
            },
            // {
            //   label: "开始日期",
            //   prop: "startDate",
            //   type: "date",
            //   format: 'yyyy-MM-dd',
            //   valueFormat: 'yyyy-MM-dd',
            //   rules: [{
            //     required: true,
            //     message: "请输入开始日期",
            //     trigger: "blur"
            //   }]
            // },
            // {
            //   label: "结束日期",
            //   prop: "endDate",
            //   type: "date",
            //   format: 'yyyy-MM-dd',
            //   valueFormat: 'yyyy-MM-dd',
            //   rules: [{
            //     required: true,
            //     message: "请输入结束日期",
            //     trigger: "blur"
            //   }]
            // },
            {
              label: "排班期间的假期天数",
              labelWidth:160,
              span: 24,
              prop: "vacationTimes",
              type: "number",
              rules: [
                { validator: validateDayNumber, trigger: 'blur' },
                {
                required: true,
                message: "请选择排班时间后再填写假期天数",
                trigger: "blur"
              }]
            },
            {
              label: "日班最小护士数",
              prop: "dayNurseNumber",
              type: "number",
              labelWidth:150,
              value:4,
              rules: [{
                required: true,
                message: "请输入日班最小护士数",
                trigger: "blur"
              }]
            },
            {
              label: "夜班护士数",
              labelWidth:150,
              prop: "nightNurseNumber",
              type: "number",
              value:2,
              rules: [{
                required: true,
                message: "请输入夜班护士数",
                trigger: "blur"
              }]
            },
            {
              label: "日班最小助手数",
              labelWidth:150,
              prop: "dayAssistantNumber",
              type: "number",
              value:2,
              rules: [{
                required: true,
                message: "请输入日班最小助手数",
                trigger: "blur"
              }]
            },
            {
              label: "夜班助手数",
              labelWidth:150,
              prop: "nightAssistantNumber",
              type: "number",
              value:1,
              rules: [{
                required: true,
                message: "请输入夜班助手数",
                trigger: "blur"
              }]
            },
            {
              label: "采用状态",
              prop: "state",
              type: "select",
              dicUrl: '/api/blade-system/dict/dictionary?code=reference_config_state',
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              addDisplay: false,
              editDisabled:true,
              rules: [{
                required: true,
                message: "请输入采用状态",
                trigger: "blur"
              }]
            },
          ]
        },
        data: []
      };
    },
    watch:{
      'from':{

      }
    },
    computed: {
      ...mapGetters(["permission"]),
      permissionList() {
        return {
          addBtn: this.vaildData(this.permission.schedulingreference_add, false),
          viewBtn: this.vaildData(this.permission.schedulingreference_view, false),
          delBtn: this.vaildData(this.permission.schedulingreference_delete, false),
          editBtn: this.vaildData(this.permission.schedulingreference_edit, false),
          recheckBtn: this.vaildData(this.permission.schedulingreference_recheck, false),
          checkBtn: this.vaildData(this.permission.schedulingreference_check, false),
          schedulingBtn: this.vaildData(this.permission.schedulingreference_scheduling, false)
        };
      },
      ids() {
        let ids = [];
        this.selectionList.forEach(ele => {
          ids.push(ele.id);
        });
        return ids.join(",");
      }
    },
    methods: {
      scheduling(row){
        //todo 排班，在排班结果出来之前显示加载弹框支持显示结束状态
        //弹出加载弹窗，仅当服务完成后才退出
        scheduling(row).then(() => {
          this.onLoad(this.page);
          this.$message({
            type: "success",
            message: "操作成功!"
          });
        }, error => {
          this.$message({
            type: "warning",
            message: "操作失败!"
          });
          loading();
        });
      },
      showDrawer(type){
        this.dialogVisible=true;
        //通过不同的查看判断是否可以编辑
        if (["check", "recheck"].includes(type)) {
          getDetail(this.selectionList[0].id).then(res => {
            this.form = res.data.data;
          });
          //禁止编辑
          this.option.column.forEach(x => {
            x.disabled=true;
          });
          //禁用原生按钮状态
          this.option.emptyBtn=false;
          this.option.submitBtn=false;
        }
        if (type==="check"){
          this.dialogTitle="排班配置状态审核";
          this.dialogType="check";
          // let state = this.findObject(this.option.column, 'state');
          // state.disabled=false;
        }
        else if (type==="recheck"){
          this.dialogTitle="排班配置状态反审";
          this.dialogType="recheck";
        }
      },
      checkReference(){
        //审核配置
        if (this.selectionList.length === 0||this.selectionList.length>1) {
          this.$message.warning("请选择一条数据");
          return;
        }
        //判断状态是否正确
        if ([0,1,2].includes(this.selectionList[0].state)){
          this.showDrawer("check");
        }else {
          this.$message.warning("请确认配置状态是否为：未启用、期望录入或待排班");
        }
      },
      recheckReference(){
        //反审配置
        if (this.selectionList.length === 0||this.selectionList.length>1) {
          this.$message.warning("请选择一条数据");
          return;
        }
        //判断状态是否正确
        if ([4,5].includes(this.selectionList[0].state)){
          this.showDrawer("recheck");
        }else {
          this.$message.warning("请确认配置状态是否为：排班失败或排班成功");
        }
      },
      handleCheckSubmit(status){
        //判断状态是否符合业务条件
        if (status==="off"){
          this.form.state=0;
        }else if (status==="on"){
          this.form.state=1;
        }else if (status==="ready"){
          this.form.state=2;
        }
        //判断状态是否正确
        if ([0,1,2].includes(this.form.state)){
          //提交
          changeState(this.form).then(() => {
            this.onLoad(this.page);
            this.$message({
              type: "success",
              message: "操作成功!"
            });
          }, error => {
            this.$message({
              type: "warning",
              message: "操作失败!"
            });
            loading();
          });
        }else {
          this.$message.warning("请确认配置状态是否为：未启用、期望录入或待排班");
        }
        this.handleDrawerClose();
      },
      handleRecheckSubmit(){
        //判断状态是否符合业务条件
        //判断状态是否正确
        if ([4,5].includes(this.form.state)){
          //提交
          recheckState(this.form).then(() => {
            this.onLoad(this.page);
            this.$message({
              type: "success",
              message: "操作成功!"
            });
          }, error => {
            this.$message({
              type: "warning",
              message: "操作失败!"
            });
            loading();
          });
        }else {
          this.$message.warning("请确认配置状态是否为：排班失败或排班成功");
        }
      },
      handleDrawerClose(){
        this.dialogVisible=false;
        this.dialogTitle='';
        //恢复状态
        this.option.column.forEach(x => {
          x.disabled=false;
        });
        //回复原生按钮状态
        this.option.emptyBtn=true;
        this.option.submitBtn=true;
      },
      rowSave(row, done, loading) {
        add(row).then(() => {
          done();
          this.onLoad(this.page);
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
          this.onLoad(this.page);
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
            this.onLoad(this.page);
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
            this.onLoad(this.page);
            this.$message({
              type: "success",
              message: "操作成功!"
            });
            this.$refs.crud.toggleSelection();
          });
      },
      beforeOpen(done, type) {
        if (["edit", "view"].includes(type)) {
          getDetail(this.form.id).then(res => {
            this.form = res.data.data;
          });
        }
        done();
      },
      searchReset() {
        this.query = {};
        this.onLoad(this.page);
      },
      searchChange(params, done) {
        this.query = params;
        this.page.currentPage = 1;
        this.onLoad(this.page, params);
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
        this.page.currentPage = currentPage;
      },
      sizeChange(pageSize){
        this.page.pageSize = pageSize;
      },
      onLoad(page, params = {}) {
        this.loading = true;
        getList(page.currentPage, page.pageSize, Object.assign(params, this.query)).then(res => {
          const data = res.data.data;
          this.page.total = data.total;
          this.data = data.records;
          this.loading = false;
          this.selectionClear();
        });
      }
    }
  };
</script>

<style>
</style>
