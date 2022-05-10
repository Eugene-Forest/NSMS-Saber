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


      </template>
      <template slot-scope="{row,index}" slot="menu">
        <el-button type="danger"
                   size="small"
                   icon="el-icon-add"
                   plain
                   v-if="permission.reference_add&&row.state==1"
                   @click="openDrawerToAdd(row)">添 加 期 望
        </el-button>
        <el-button type="primary"
                   size="small"
                   icon="el-icon-view"
                   plain
                   v-if="permission.reference_view"
                   @click="openDrawerToView(row)">查 看
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

    <el-drawer
      id="approval-form"
      :title="drawerTitle"
      :destroy-on-close="true"
      append-to-body
      size="80%"
      @close="handleDrawerClose"
      :visible.sync="drawerVisible">
      <el-row>
        <avue-form v-if="drawerVisible" :option="option" v-model="form" ref="formMain">

        </avue-form>
      </el-row>
      <el-row>
        <reference-expectation
          :referenceSid="referenceId" :state="state">

        </reference-expectation>
      </el-row>
    </el-drawer>

  </basic-container>
</template>

<script>
  import {getList, getDetail, add, update, remove} from "@/api/nsms/schedulingreference";
  import {mapGetters} from "vuex";
  import referenceExpectation from "@/views/nsms/reference-expectation";


  export default {
    components:{
      referenceExpectation
    },
    data() {
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
        drawerVisible:false,
        referenceId:'',
        drawerTitle:"",
        state:-1,
        option: {
          height: 'auto',
          calcHeight: 210,
          searchShow: true,
          searchMenuSpan: 6,
          tip: false,
          border: true,
          index: true,
          viewBtn: false,
          addBtn:false,
          editBtn:false,
          delBtn:false,
          selection: true,
          column: [
            {
              label: "科室编号",
              prop: "departmentId",
              type: "tree",
              disabled:true,
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
              span: 15,
              type: "daterange",
              format:'yyyy-MM-dd',
              valueFormat:'yyyy-MM-dd',
              startPlaceholder: '日期开始范围自定义',
              endPlaceholder: '日期结束范围自定义',
              disabled:true,
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
            {
              label: "排班期间的假期天数",
              labelWidth:160,
              span: 9,
              disabled:true,
              prop: "vacationTimes",
              type: "number",
              rules: [
                // { validator: validateVacationTimes, trigger: 'blur' },
                {
                required: true,
                message: "请选择排班时间后再填写假期天数",
                trigger: "blur"
              }]
            },
            {
              label: "采用状态",
              prop: "state",
              disabled:true,
              type: "select",
              dicUrl: '/api/blade-system/dict/dictionary?code=reference_config_state',
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              addDisplay: false,
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
          addBtn: this.vaildData(this.permission.reference_add, false),
          viewBtn: this.vaildData(this.permission.reference_view, false),
          delBtn: this.vaildData(this.permission.reference_delete, false),
          editBtn: this.vaildData(this.permission.reference_edit, false)
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
      openDrawerToAdd(row){
        this.state=1;
        this.openDrawer(row);
      },
      openDrawerToView(row){
        this.state=0;
        this.openDrawer(row);
      },
      openDrawer(row){
        //获取数据
        getDetail(row.id).then(res=>{
          this.form=res.data.data;
          this.drawerTitle=res.data.data.title;
        })
        this.referenceId=row.id;

        //禁止原生按钮
        this.option.emptyBtn=false;
        this.option.submitBtn=false;
        //显示
        this.drawerVisible=true;
      },
      handleDrawerClose(){
        this.drawerVisible=false;
        this.referenceId="";
        this.drawerTitle="";
        this.state=-1;
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
