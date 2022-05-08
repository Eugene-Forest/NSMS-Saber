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
        <el-button type="primary"
                   size="small"
                   icon="el-icon-plus"
                   v-if="permission.leaverecord_add"
                   @click="leaveRecordAdd">新 增
        </el-button>
      </template>
      <!--      每行的审核状态的模板-->
      <template slot-scope="{row}" slot="approvalStatus">
        <el-tag v-show="row.approvalStatus == '0'" type="info">未审核</el-tag>
        <el-tag v-show="row.approvalStatus == '1'" type="danger">驳回</el-tag>
        <el-tag v-show="row.approvalStatus == '2'" type="success">通过</el-tag>
      </template>

      <template slot="leaveShift" slot-scope="{row}">
        <el-tag effect="plain" type="info" v-show="row.leaveShift==0">早班</el-tag>
        <el-tag effect="plain" type="info" v-show="row.leaveShift==1">晚班</el-tag>
      </template>


      <template slot-scope="{ row }" slot="menu">
        <el-button
          type="text"
          class="button-text"
          icon="el-icon-view"
          size="mini"
          plain
          @click="$refs.crud.rowEdit(row,index)"
          v-show="row.approvalStatus==0"
        >编辑
        </el-button>
        <el-button
          type="text"
          class="button-text"
          icon="el-icon-view"
          size="mini"
          plain
          @click="$refs.crud.rowDel(row)"
          v-show="row.approvalStatus==0"
        >删除
        </el-button>
      </template>

    </avue-crud>
  </basic-container>
</template>

<script>
  import {getList, getDetail, add, update, remove} from "@/api/nsms/leaverecord";
  import {mapGetters} from "vuex";
  import {getUserIdAndName} from "@/api/nsms/nurseinfo";

  export default {
    data() {
      return {
        form: {},
        query: {},
        loading: true,
        page: {
          pageSize: 10,
          currentPage: 1,
          total: 0
        },
        selectionList: [],
        option: {
          height: 'auto',
          calcHeight: 210,
          searchShow: true,
          searchMenuSpan: 6,
          tip: false,
          border: true,
          index: true,
          viewBtn: true,
          delBtn: false,
          editBtn: false,
          addBtn:false,
          selection: true,
          column: [
            {
              label: "申请人",
              prop: "nurseSid",
              type: "select",
              dicUrl: "/api/nsms/nurseinfo/selectAllCo",
              props: {
                label: 'name',
                value: 'id'
              },
              addDisabled:true,
              editDisabled:true,
              rules: [{
                required: true,
                message: "请输入申请人",
                trigger: "blur"
              }]
            },
            {
              label: "请假类别",
              prop: "leaveType",
              type: "select",
              span:24,
              dicUrl: "/api/blade-system/dict/dictionary?code=leave_type",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              rules: [{
                required: true,
                message: "请输入请假类别",
                trigger: "blur"
              }]
            },
            {
              label: "请假日期",
              prop: "leaveDate",
              type: "date",
              format: 'yyyy-MM-dd',
              valueFormat: 'yyyy-MM-dd',
              rules: [{
                required: true,
                message: "请输入请假日期",
                trigger: "blur"
              }]
            },
            {
              label: "请假班次",
              prop: "leaveShift",
              type: "select",
              slot:true,
              dicUrl: "/api/blade-system/dict/dictionary?code=shift_num",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              rules: [{
                required: true,
                message: "请输入请假班次",
                trigger: "blur"
              }]
            },
            {
              label: "请假原因",
              prop: "leaveResult",
              type: "textarea",
              span: 24,
              minRows: 4,
              maxRows: 8,
              overHidden: true,
              rules: [{
                required: true,
                message: "请输入请假原因",
                trigger: "blur"
              }]
            },
            {
              label: "审批状态",
              prop: "approvalStatus",
              addDisplay:false,
              editDisplay:false,
              type: "select",
              dicUrl: "/api/blade-system/dict/dictionary?code=approval_status",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              slot:true,
              rules: [{
                required: true,
                message: "请输入审批状态",
                trigger: "blur"
              }]
            },
            {
              label: "审批意见",
              prop: "approvalOpinion",
              overHidden:true,
              addDisplay:false,
              editDisplay:false,
              rules: [{
                required: true,
                message: "请输入审批意见",
                trigger: "blur"
              }]
            },
            {
              label: "审批人",
              prop: "approver",
              type: "select",
              dicUrl: "/api/nsms/nurseinfo/selectHeadNurse",
              props: {
                label: 'name',
                value: 'id'
              },
              rules: [{
                required: true,
                message: "请输入审批人",
                trigger: "blur"
              }]
            },
          ]
        },
        data: []
      };
    },
    computed: {
      ...mapGetters(["permission"]),
      permissionList() {
        return {
          addBtn: this.vaildData(this.permission.leaverecord_add, false),
          viewBtn: this.vaildData(this.permission.leaverecord_view, false),
          delBtn: this.vaildData(this.permission.leaverecord_delete, false),
          editBtn: this.vaildData(this.permission.leaverecord_edit, false)
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
      leaveRecordAdd(){
        //先在表单中添加申请人的赋值
        getUserIdAndName().then(res=>{
          this.form.nurseSid=res.data.data.id;
        });
        //调用avue curd的自带的添加方法
        this.$refs.crud.rowAdd();
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
