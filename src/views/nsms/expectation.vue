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
                   icon="el-icon-add"
                   plain
                   v-if="permission.expectation_add"
                   @click="addExpectation">添 加 排 班 期 望
        </el-button>
        <el-button type="danger"
                   size="small"
                   icon="el-icon-delete"
                   plain
                   v-if="permission.expectation_delete"
                   @click="handleDelete">删 除
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

      <avue-form v-if="dialogVisible" :option="option" v-model="form" ref="formMain">

      </avue-form>


    </el-dialog>
  </basic-container>
</template>

<script>
  import {getList, getDetail, add, update, remove} from "@/api/nsms/expectation";
  import {mapGetters} from "vuex";

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
        dialogTitle:'',
        dialogVisible:false,
        addDialog:false,
        viewDialog:false,
        editDialog:false,
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
          addBtn:false,
          selection: true,
          column: [
            {
              label: "对应的排班依据表",
              prop: "referenceSid",
              labelWidth:160,
              span:24,
              type: "select",
              dicUrl: "/api/nsms/schedulingreference/select",
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
              startPlaceholder: '日期开始范围自定义',
              endPlaceholder: '日期结束范围自定义',
              pickerOptions: {
                disabledDate(time) {
                  return time.getTime() < Date.now();
                },
            },
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
            // {
            //   label: "申请人",
            //   prop: "nurseSid",
            //   rules: [{
            //     required: true,
            //     message: "请输入申请人id",
            //     trigger: "blur"
            //   }]
            // },
            {
              label: "天数",
              prop: "dayNumber",
              rules: [{
                required: true,
                message: "请输入夜班天数",
                trigger: "blur"
              }]
            },
            {
              label: "实现状态",
              prop: "actualState",
              type: "select",
              dicUrl: "/api/blade-system/dict/dictionary?code=actual_state",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              rules: [{
                required: true,
                message: "请输入实现状态；实现或未实现",
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
      }
    },
    methods: {
      addExpectation(){
        //布局初始化，通过不同类型的期望显示不同的字段。同时提交验证也需要针对性适应
        this.dialogVisible=true;
        this.addDialog=true;
        this.dialogTitle="添加排班期望";
      },
      handleDialogClose(){
        //关闭窗口
        this.dialogVisible=false;
        this.dialogTitle="";
        //清除状态
        this.addDialog=false;
        this.viewDialog=false;
        this.editDialog=false;
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
