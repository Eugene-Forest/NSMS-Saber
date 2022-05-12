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
        <el-button type="warning"
                   size="small"
                   icon="el-icon-s-check"
                   plain
                   v-if="permission.shift_approval"
                   @click="checkInShiftExchange">审 核
        </el-button>
        <el-button type="danger"
                   size="small"
                   icon="el-icon-s-check"
                   plain
                   v-if="permission.shift_approval_revocation"
                   @click="recheckInShiftExchange">反 审
        </el-button>
      </template>

      <!--      每行的审核状态的模板-->
      <template slot-scope="{row}" slot="applicationStatus">
        <el-tag v-show="row.applicationStatus == '0'" type="info">未商议</el-tag>
        <el-tag v-show="row.applicationStatus == '8'"  effect="dark" type="info">未商议</el-tag>
        <el-tag v-show="row.applicationStatus == '9'"  effect="dark" type="warning">我不同意</el-tag>
        <el-tag v-show="row.applicationStatus == '10'"  effect="dark" type="primary">我已同意</el-tag>
        <el-tag v-show="row.applicationStatus == '19'" type="warning">被申请人不同意</el-tag>
        <el-tag v-show="row.applicationStatus == '20'" type="primary">被申请人同意</el-tag>
        <el-tag v-show="row.applicationStatus == '30'" type="primary">待审核</el-tag>
        <el-tag v-show="row.applicationStatus == '40'" type="danger">护士长驳回</el-tag>
        <el-tag v-show="row.applicationStatus == '50'" type="success">护士长通过</el-tag>
      </template>

      <template slot="changeShift" slot-scope="{row}">
        <el-tag effect="plain" type="info" v-show="row.changeShift==0">早班</el-tag>
        <el-tag effect="plain" type="info" v-show="row.changeShift==1">晚班</el-tag>
      </template>

    </avue-crud>

    <el-drawer id="approval-form"
               :title="approvalFormTitle"
               size="1200px"
               append-to-body
               :destroy-on-close="true"
               @close="handleDialogClose"
               :visible.sync="dialogVisible">

      <avue-form v-if="dialogVisible" :option="option" v-model="form" ref="formMain">
        <template slot-scope="scope" slot="menuForm">
          <div v-if="!recheck">
            <el-button type="success" size="mini" icon="el-icon-success"
                       @click="handleSubmit(true)"
                       :loading="formOnLoading">通 过
            </el-button>
            <el-button type="danger" size="mini" icon="el-icon-error"
                       @click="handleSubmit(false)"
                       :loading="formOnLoading">驳 回
            </el-button>
            <el-button size="mini" icon="el-icon-close"
                       @click="dialogVisible = false"
                       :loading="formOnLoading">退 出 审 核
            </el-button>
          </div>
          <div v-if="recheck">
            <el-button size="mini" icon="el-icon-close" round type="danger"
                       @click="recheckBack"
                       :loading="formOnLoading">撤 销 审 核
            </el-button>
            <el-button size="mini" icon="el-icon-close" round
                       @click="dialogVisible = false"
                       :loading="formOnLoading">退 出 反 审
            </el-button>
          </div>
        </template>

      </avue-form>


    </el-drawer>


  </basic-container>
</template>

<script>
import {
  getDetail,
  add,
  update,
  remove,
  checkIn,
  recheckIn,
  getListForApproval
} from "@/api/nsms/shiftrecord";
  import {mapGetters} from "vuex";
import {selectAllCo} from "@/api/nsms/nurseinfo";

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
        dialogVisible:false,
        formOnLoading: false,
        recheck:false,
        approvalFormTitle: '',
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
          addBtn: false,
          selection: true,
          excelBtn:true,
          menu:false,
          column: [
            {
              label: "申请人",
              prop: "applicantSid",
              type: "select",
              dicDate:[],
              // dicUrl: "/api/nsms/nurseinfo/selectAllCo",
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
              label: "被请求人",
              prop: "beRequestedSid",
              type: "select",
              dicDate:[],
              // dicUrl: "/api/nsms/nurseinfo/selectAllCo",
              props: {
                label: 'name',
                value: 'id'
              },
              rules: [{
                required: true,
                message: "请输入被请求人",
                trigger: "blur"
              }]
            },
            {
              label: "换班日期",
              prop: "changeDate",
              type: "date",
              format: 'yyyy-MM-dd',
              valueFormat: 'yyyy-MM-dd',
              rules: [{
                required: true,
                message: "请输入换班日期",
                trigger: "blur"
              }]
            },
            {
              label: "换班班次",
              prop: "changeShift",
              type: "select",
              slot:true,
              dicUrl: "/api/blade-system/dict/dictionary?code=shift_num",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              rules: [{
                required: true,
                message: "请输入换班班次",
                trigger: "blur"
              }]
            },
            {
              label: "换班原因",
              prop: "changeResult",
              type: "textarea",
              span: 24,
              minRows: 4,
              maxRows: 8,
              overHidden: true,
              rules: [{
                required: true,
                message: "请输入换班原因",
                trigger: "blur"
              }]
            },
            {
              label: "申请状态",
              prop: "applicationStatus",
              type: "select",
              slot:true,
              overHidden: false,
              dicUrl: "/api/blade-system/dict/dictionary?code=exchange_approval_status",
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              rules: [{
                required: true,
                message: "请输入申请状态",
                trigger: "blur"
              }]
            },
            {
              label: "审批意见",
              prop: "approvalOpinion",
              type: "textarea",
              span: 24,
              minRows: 4,
              maxRows: 8,
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
              dicData:[],
              // dicUrl: "/api/nsms/nurseinfo/selectHeadNurses",
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
          checkInBtn: this.vaildData(this.permission.shift_approval, false),
          recheckInBtn: this.vaildData(this.permission.shift_approval_revocation, false),
          // addBtn: this.vaildData(this.permission.shiftrecord_add, false),
          viewBtn: this.vaildData(this.permission.shiftrecord_view, false),
          // delBtn: this.vaildData(this.permission.shiftrecord_delete, false),
          // editBtn: this.vaildData(this.permission.shiftrecord_edit, false)
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
      this.init();
    },
    methods: {
      init(){
        //初始化字典
        selectAllCo().then(res=>{
          //并将申请人和被申请人的字典赋值
          const applicantSid = this.findObject(this.option.column, 'applicantSid');
          const beRequestedSid = this.findObject(this.option.column, 'beRequestedSid');
          const approver = this.findObject(this.option.column, 'approver');
          applicantSid.dicData = res.data.data;
          beRequestedSid.dicData = res.data.data;
          approver.dicData = res.data.data;
        })
      },
      checkInShiftExchange(){
        if (this.selectionList.length === 0||this.selectionList.length>1) {
          this.$message.warning("请选择一条数据");
          return;
        }
        //判断是否可以进行审核
        this.form=this.selectionList[0];
        //只有在被申请人同意的情况下才可以审核
        if (this.form["applicationStatus"]!==20){
          this.form={};
          this.$message.warning("此记录不能审核！请确认其审核状态！");
          return;
        }
        //打开抽屉
        this.dialogVisible=true;
        this.recheck=false;
        //禁止编辑
        this.option.column.forEach(x => {
          x.disabled=true;
        });
        let approvalOpinionCol= this.findObject(this.option.column, 'approvalOpinion');
        approvalOpinionCol.disabled=false;
        //隐藏列
        let approver= this.findObject(this.option.column, 'approver');
        approver.display=false;
        //禁止原生按钮
        this.option.emptyBtn=false;
        this.option.submitBtn=false;
        this.approvalFormTitle='换班审核';
      },
      recheckInShiftExchange(){
        if (this.selectionList.length === 0||this.selectionList.length>1) {
          this.$message.warning("请选择一条数据");
          return;
        }
        //判断是否可以进行反审
        this.form=this.selectionList[0];
        if (this.form["applicationStatus"]<=30||this.form["applicationStatus"]>50){
          this.form={};
          this.$message.warning("此记录不能反审！请确认其审核状态！");
          return;
        }
        //打开抽屉
        this.dialogVisible=true;
        this.recheck=true;
        //禁止编辑
        this.option.column.forEach(x => {
          x.disabled=true;
        });
        //隐藏列
        let approver= this.findObject(this.option.column, 'approver');
        approver.display=false;
        //禁止原生按钮
        this.option.emptyBtn=false;
        this.option.submitBtn=false;
        this.approvalFormTitle='换班反审';
      },
      handleDialogClose(){
        //恢复
        this.option.column.forEach(x => {
          x.disabled=false;
        });
        let approver= this.findObject(this.option.column, 'approver');
        approver.display=true;
        //禁止原生按钮
        this.option.emptyBtn=true;
        this.option.submitBtn=true;
        this.approvalFormTitle='';
      },
      handleSubmit(flag){
        this.$refs.formMain.validate(valid => {
            if (valid) {
              let data = this.form;
              if (flag) {
                data["applicationStatus"] = 50;
              } else {
                data["applicationStatus"] = 40;
              }
              checkIn(data).then(() => {
                this.formOnLoading = false;
                //隐藏抽屉
                this.dialogVisible = false;
                //刷新
                this.onLoad(this.page);
                this.$message({type: 'success', message: '操作成功!'});
              }, error => {
                this.$message.error('业务出错！');
                // console.log(error);
              });
            }else {
                this.$message.warning('请检查必填项！');
            }
        })
      },
      recheckBack(){
        this.$refs.formMain.validate(valid => {
          if (valid) {
            let data = this.form;
            if (this.form["applicationStatus"]!=50&&this.form["applicationStatus"]!=40){
              this.$message({message:"请检查必填项",type:"warning",customClass:'topToDialogIndex'});
              this.formOnLoading = false;
              //隐藏抽屉
              this.dialogVisible = false;
              //刷新
              this.onLoad(this.page);
              return;
            }
            recheckIn(data).then(() => {
              this.formOnLoading = false;
              //隐藏抽屉
              this.dialogVisible = false;
              //刷新
              this.onLoad(this.page);
              this.$message({type: 'success', message: '操作成功!'});
            }, error => {
              this.$message.error('业务出错！');
              // console.log(error);
            });
          }else {
            this.$message.warning('请检查必填项！');
          }
        })
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
            // return remove(row.id);
            let objectList=[];
            objectList.push(row);
            return remove(objectList);
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
            // return remove(this.ids);
            return remove(this.selectionList);
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
        getListForApproval(page.currentPage, page.pageSize, Object.assign(params, this.query)).then(res => {
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
