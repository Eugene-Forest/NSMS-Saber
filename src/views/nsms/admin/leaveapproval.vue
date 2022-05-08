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
                   v-if="permission.leaverecord_approval"
                   @click="checkInLeaveRecord">审 核
        </el-button>
        <el-button type="danger"
                   size="small"
                   icon="el-icon-s-check"
                   plain
                   v-if="permission.leaverecord_approval_revocation"
                   @click="recheckInLeaveRecord">反 审
        </el-button>
      </template>

      <!--      每行的审核状态的模板-->
      <template slot="approvalStatus" slot-scope="{row}">
        <el-tag v-show="row.approvalStatus===0" type="info">未审核</el-tag>
        <el-tag v-show="row.approvalStatus===1" type="danger">驳回</el-tag>
        <el-tag v-show="row.approvalStatus===2" type="success">通过</el-tag>
      </template>

      <template slot="leaveShift" slot-scope="{row}">
        <el-tag effect="plain" type="info" v-show="row.leaveShift==0">早班</el-tag>
        <el-tag effect="plain" type="info" v-show="row.leaveShift==1">晚班</el-tag>
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
import { getDetail, add, update, remove, recheckIn, checkIn, getListForApproval} from "@/api/nsms/leaverecord";
  import {mapGetters} from "vuex";
  import {getDictionary} from "@/api/system/dict";

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
          column: [
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
              overHidden:true,
              rules: [{
                required: true,
                message: "请输入请假原因",
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
              rules: [{
                required: true,
                message: "请输入申请人",
                trigger: "blur"
              }]
            },
            {
              label: "员工编号",
              prop: "wNo",
              editDisplay:false,
              viewDisplay:false,
              hide:true,
              rules: [{
                required: true,
                message: "请输入申请人",
                trigger: "blur"
              }]
            },
            {
              label: "审批状态",
              prop: "approvalStatus",
              type: "select",
              dicUrl: "/api/blade-system/dict/dictionary?code=approval_status",
              editDisplay:false,
              viewDisplay:false,
              slot:true,
              props: {
                label: 'dictValue',
                value: 'dictKey'
              },
              rules: [{
                required: true,
                message: "请输入审批状态",
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
              overHidden:true,
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
              dicUrl: "/api/nsms/nurseinfo/selectHeadNurses",
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
          approvalBtn: this.vaildData(this.permission.leaverecord_approval, false),
          revocationBtn: this.vaildData(this.permission.leaverecord_approval_revocation, false),
          // viewBtn: this.vaildData(this.permission.leaverecord_view, false),
          // delBtn: this.vaildData(this.permission.leaverecord_delete, false),
          // editBtn: this.vaildData(this.permission.leaverecord_edit, false)
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
      this.initSysData();
    },
    methods: {
      initSysData(){
        // getDictionary({code:"approval_status"}).then(res => {
        //   const column = this.findObject(this.option.column, 'approvalStatus');
        //   column.dicData = res.data.data;
        // });
      },
      handleApproval() {
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
      checkInLeaveRecord(){
        if (this.selectionList.length === 0||this.selectionList.length>1) {
          this.$message.warning("请选择一条数据");
          return;
        }
        //赋值
        this.form=this.selectionList[0];
        //判断状态是否为已审核
        if (this.form["approvalStatus"]!==0){
          this.$message.warning("请确认状态是否为未审核！");
          this.form={};
          return;
        }
        //打开抽屉或窗口用来审核、
        //隐藏列
        let approvalStatus = this.findObject(this.option.column, 'approvalStatus');
        approvalStatus.display=false;
        let wNo = this.findObject(this.option.column, 'wNo');
        wNo.display=false;
        //禁止编辑
        this.option.column.forEach(x => {
          x.disabled=true;
        });
        let approvalOpinion = this.findObject(this.option.column, 'approvalOpinion');
        approvalOpinion.disabled=false;
        //禁止原生按钮
        this.option.emptyBtn=false;
        this.option.submitBtn=false;
        //显示抽屉
        this.dialogVisible=true;
        this.approvalFormTitle='请假记录审核';
      },
      handleDialogClose(){
        //清空
        this.form={};
        //回复列状态
        let approvalStatus = this.findObject(this.option.column, 'approvalStatus');
        approvalStatus.display=true;
        let wNo = this.findObject(this.option.column, 'wNo');
        wNo.display=true;
        this.option.column.forEach(x => {
          x.disabled=false;
        });
        //回复原生按钮状态
        this.option.emptyBtn=true;
        this.option.submitBtn=true;
        //恢复审核复审状态判断值
        this.recheck=false;
        this.approvalFormTitle='';
      },
      recheckInLeaveRecord(){
        if (this.selectionList.length === 0||this.selectionList.length>1) {
          this.$message.warning("请选择一条数据");
          return;
        }
        //隐藏列
        let wNo = this.findObject(this.option.column, 'wNo');
        wNo.display=false;
        //禁止编辑
        this.option.column.forEach(x => {
          x.disabled=true;
        });
        //禁止原生按钮
        this.option.emptyBtn=false;
        this.option.submitBtn=false;

        //赋值
        this.form=this.selectionList[0];
        //先判断数据是否已经被审核，如果被审核则不能反审，即不出现反审按钮
        if (this.form["approvalStatus"]==0){
          this.$message.info("此数据处于未审核状态，不能反审！");
          this.recheck=false;
          this.form={};
        }else if (this.form["approvalStatus"]==1||this.form["approvalStatus"]==2){
          this.recheck=true;
          //显示抽屉
          this.dialogVisible=true;
          this.approvalFormTitle='请假记录反审';
        }else {
          this.$message.warning("请确认被选数据的审核状态是否正确！");
          this.form={};
        }
      },
      handleSubmit(flag){
        //验证必填项
        this.$refs.formMain.validate(valid => {
          if (valid){
            let data=this.form;
            if (flag){
              data["approvalStatus"]=2;
            }else {
              data["approvalStatus"]=1;
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
        //撤销审核
        this.$refs.formMain.validate(valid => {
          if (valid){
            let data=this.form;
            if (this.form["approvalStatus"]!=1&&this.form["approvalStatus"]!=2){
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
  .topToDialogIndex{
    z-index: 3000 !important;
  }
</style>
