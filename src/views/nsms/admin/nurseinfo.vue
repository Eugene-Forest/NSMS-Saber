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
        <el-button type="danger"
                   size="small"
                   icon="el-icon-delete"
                   plain
                   v-if="permission.nurseinfo_delete"
                   @click="handleDelete">删 除
        </el-button>
      </template>

<!--      &lt;!&ndash;      每行的就职状态的模板&ndash;&gt;-->
<!--      <template slot-scope="{row}" slot="workingCondition">-->
<!--        <div v-show="row.workingCondition == '1'">在职</div>-->
<!--        <div v-show="row.workingCondition == '2'">离职</div>-->
<!--      </template>-->

    </avue-crud>
  </basic-container>
</template>

<script>
  import {getList, getDetail, add, update, remove} from "@/api/nsms/nurseinfo";
  import {mapGetters} from "vuex";
  import {getDictionary} from "@/api/system/dict";
  import {getDeptTree} from "@/api/system/dept";
  import {getPostList} from "@/api/system/post";
  import {getRoleTree} from "@/api/system/role";

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
          selection: true,
          column: [
            {
              label: "姓名",
              prop: "name",
              rules: [{
                required: true,
                message: "请输入姓名",
                trigger: "blur"
              }]
            },
            {
              label: "年龄",
              prop: "age",
              type: "number",
              rules: [{
                required: true,
                message: "请输入年龄",
                trigger: "blur"
              }]
            },
            {
              label: "性别",
              prop: 'gender',
              type: "select",
              dicData: [
              ],
              // dicUrl: "/api/blade-system/dict/dictionary?code=sex",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              rules: [{
                required: true,
                message: "请选择男女性别",
                trigger: "click"
              }]
            },
            {
              label: "出生年月",
              prop: "birthday",
              type: "date",
              format: 'yyyy-MM-dd',
              valueFormat: 'yyyy-MM-dd',
              rules: [{
                required: true,
                message: "请输入出生年月日",
                trigger: "blur"
              }]
            },
            {
              label: "手机号",
              prop: "telephone",
              rules: [{
                required: true,
                message: "请输入手机号",
                trigger: "blur"
              }]
            },
            // {
            //   label: "职工号",
            //   prop: "wNo",
            //   rules: [{
            //     required: true,
            //     message: "请输入职工号",
            //     trigger: "blur"
            //   }]
            // },
            {
              label: "职位",
              prop: "position",
              type: "select",
              width: 170,
              search: true,
              searchSpan: 4,
              span: 8,
              dicData: [],
              // dicUrl: "/api/blade-system/dict/dictionary?code=post",
              props: {
                label: 'postName',
                value: 'id'
              },
              rules: [{
                required: true,
                message: "请选择职位",
                trigger: "blur"
              }]
            },
            {
              label: "部门",
              prop: "department",
              type: "tree",
              dicData: [],
              // dicUrl: "/api/blade-system/dept/tree",
              props: {
                label: 'title',
                value: 'key'
              },
              rules: [{
                required: true,
                message: "请输入部门",
                trigger: "blur"
              }]
            },
            {
              label: "所属角色",
              prop: "roleId",
              hide:true,
              viewDisplay:false,
              editDisplay:false,
              type: "tree",
              dicData: [],
              props: {
                label: "title"
              },
              slot: true,
              rules: [{
                required: true,
                message: "请选择所属角色",
                trigger: "click"
              }]
            },
            {
              label: "就职状态",
              prop: "workingCondition",
              type: "select",
              dicData: [],
              // dicUrl: "/api/blade-system/dict/dictionary?code=working_condition",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              rules: [{
                required: true,
                message: "请选择就职状态",
                trigger: "click"
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
          addBtn: this.vaildData(this.permission.nurseinfo_add, false),
          viewBtn: this.vaildData(this.permission.nurseinfo_view, false),
          delBtn: this.vaildData(this.permission.nurseinfo_delete, false),
          editBtn: this.vaildData(this.permission.nurseinfo_edit, false)
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
    created() {
      this.initSysData();
    },
    methods: {
      //初始化并获取字典
      initSysData() {

        getDictionary({code:"sex"}).then(res => {
          const column = this.findObject(this.option.column, 'gender');
          column.dicData = res.data.data;
        });

        getRoleTree().then(res => {
          const column = this.findObject(this.option.column, "roleId");
          column.dicData = res.data.data;
        });

        getPostList().then(res => {
            const column = this.findObject(this.option.column, 'position');
            column.dicData = res.data.data;
        });

        getDictionary({code:"working_condition"}).then(res => {
          const column = this.findObject(this.option.column, 'workingCondition');
          column.dicData = res.data.data;
        });

        getDeptTree().then(res => {
          const column = this.findObject(this.option.column, 'department');
          column.dicData = res.data.data;
        });

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
