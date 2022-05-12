<template>
  <basic-container>
    <avue-crud :option="option"
               :table-loading="loading"
               :data="data"
               :page="page"
               :permission="permissionList"
               :before-open="beforeOpen"
               :before-close="beforeClose"
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
                   v-if="permission.shiftrecord_add"
                   @click="shiftRecordAdd">新 增
        </el-button>
        <el-button type="warning"
                   size="small"
                   icon="el-icon-s-check"
                   plain
                   v-if="permission.shift_approval"
                   @click="checkInShiftExchange">商 议 审 核
        </el-button>
        <el-button type="danger"
                   size="small"
                   icon="el-icon-s-check"
                   plain
                   v-if="permission.shift_approval_revocation"
                   @click="recheckInShiftExchange">撤 销
        </el-button>
      </template>

<!--      其中审核状态8~10都是表示此纪录本人是作为被申请者，用来区分换班申请的创建者
          ，其实际含义以及数据库存储对应0、19、20的状态
-->
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

      <template slot-scope="{ row }" slot="menu">
        <el-button
          type="text"
          class="button-text"
          icon="el-icon-view"
          size="mini"
          plain
          @click="$refs.crud.rowEdit(row,index)"
          v-show="row.applicationStatus==0"
        >编辑
        </el-button>
        <el-button
          type="text"
          class="button-text"
          icon="el-icon-view"
          size="mini"
          plain
          @click="$refs.crud.rowDel(row)"
          v-show="row.applicationStatus==0"
        >删除
        </el-button>
      </template>
    </avue-crud>

    <el-drawer id="approval-form"
               :title="approvalFormTitle"
               size="1200px"
               append-to-body
               :destroy-on-close="true"
               @close="handleDialogClose"
               :visible.sync="drawerVisible">

      <avue-form v-if="drawerVisible" :option="option" v-model="form" ref="formMain">
        <template slot-scope="scope" slot="menuForm">
          <div v-if="!recheck">
            <el-button type="success" size="mini" icon="el-icon-success"
                       @click="handleSubmit(true)"
                       :loading="formOnLoading">同 意
            </el-button>
            <el-button type="danger" size="mini" icon="el-icon-error"
                       @click="handleSubmit(false)"
                       :loading="formOnLoading">不同意
            </el-button>
            <el-button size="mini" icon="el-icon-close"
                       @click="drawerVisible = false"
                       :loading="formOnLoading">退 出 商 议
            </el-button>
          </div>
          <div v-if="recheck">
            <el-button size="mini" icon="el-icon-close" round type="danger"
                       @click="recheckBack"
                       :loading="formOnLoading">撤 销 商 议 结 果
            </el-button>
            <el-button size="mini" icon="el-icon-close" round
                       @click="drawerVisible = false"
                       :loading="formOnLoading">退 出 撤 销 商 议
            </el-button>
          </div>
        </template>

      </avue-form>
    </el-drawer>

<!--    <el-dialog-->
<!--      id="approval-form"-->
<!--      :title="drawerTitle"-->
<!--      :destroy-on-close="true"-->
<!--      append-to-body-->
<!--      size="80%"-->
<!--      @close="handleClose"-->
<!--      :visible.sync="dialogVisible">-->
<!--      <el-row>-->
<!--        <staff-time>-->

<!--        </staff-time>-->
<!--      </el-row>-->
<!--    </el-dialog>-->
  </basic-container>
</template>

<script>
import {add, confer, getDetail, getList, reConfer, remove, update} from "@/api/nsms/shiftrecord";
import {mapGetters} from "vuex";
import {getUserIdAndName, selectAllCo, selectCoWorkers} from "@/api/nsms/nurseinfo";
import StaffTime from "@/views/nsms/nurse/stafftime";

export default {
    components: {StaffTime},
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
        drawerVisible:false,
        formOnLoading: false,
        recheck:false,
        approvalFormTitle: '',
        //同部门的全部基础人员的id-名字键值字典
        allBaseNurseDict:[],
        //同部门的除了自己的基础人员的id-名字键值字典
        coBaseNurseDict:[],
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
              prop: "applicantSid",
              type: "select",
              dicData:[],
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
              dicData:[],
              // dicUrl: "/api/nsms/nurseinfo/selectCoWorker",
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
              pickerOptions: {
                disabledDate(time) {
                  return time.getTime() < Date.now();
                },
              },
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
              addDisplay:false,
              editDisplay:false,
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
              addDisabled:true,
              editDisabled:true,
              type: "textarea",
              span: 24,
              minRows: 4,
              maxRows: 8,
              overHidden: true,
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
                message: "请输入审批人id",
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
          addBtn: this.vaildData(this.permission.shiftrecord_add, false),
          viewBtn: this.vaildData(this.permission.shiftrecord_view, false),
          delBtn: this.vaildData(this.permission.shiftrecord_delete, false),
          editBtn: this.vaildData(this.permission.shiftrecord_edit, false),
          conferBtn: this.vaildData(this.permission.shift_approval, false),
          reConferBtn: this.vaildData(this.permission.shift_approval_revocation, false)
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
          this.allBaseNurseDict=res.data.data;
          //并将申请人和被申请人的字典赋值
          const applicantSid = this.findObject(this.option.column, 'applicantSid');
          const beRequestedSid = this.findObject(this.option.column, 'beRequestedSid');
          applicantSid.dicData = this.allBaseNurseDict;
          beRequestedSid.dicData = this.allBaseNurseDict;
        })
        selectCoWorkers().then(res=>{
          this.coBaseNurseDict=res.data.data;
        })
      },
      shiftRecordAdd(){
        //先在表单中添加申请人的赋值
        getUserIdAndName().then(res=>{
          this.form.applicantSid=res.data.data.id;
        });
        //调用avue curd的自带的添加方法
        this.$refs.crud.rowAdd();
      },
      checkInShiftExchange(){
        if (this.selectionList.length === 0||this.selectionList.length>1) {
          this.$message.warning("请选择一条数据");
          return;
        }
        //判断是否可以进行审核
        this.form=this.selectionList[0];
        if (this.form["applicationStatus"]!=8){
          this.form={};
          this.$message.warning("此记录不能审核！请确认其审核状态！");
          return;
        }
        //打开抽屉
        this.drawerVisible=true;
        this.recheck=false;
        //禁止编辑
        this.option.column.forEach(x => {
          x.disabled=true;
        });
        //隐藏列
        let approvalOpinionCol= this.findObject(this.option.column, 'approvalOpinion');
        approvalOpinionCol.display=false;
        //禁止原生按钮
        this.option.emptyBtn=false;
        this.option.submitBtn=false;
        this.approvalFormTitle='换班商议';
      },
      recheckInShiftExchange(){
        if (this.selectionList.length === 0||this.selectionList.length>1) {
          this.$message.warning("请选择一条数据");
          return;
        }
        //判断是否可以进行反审
        this.form=this.selectionList[0];
        if (this.form["applicationStatus"]!=9&&this.form["applicationStatus"]!=10){
          this.form={};
          this.$message.warning("此记录不能反审！请确认其审核状态！");
          return;
        }
        //打开抽屉
        this.drawerVisible=true;
        this.recheck=true;
        //禁止编辑
        this.option.column.forEach(x => {
          x.disabled=true;
        });
        //隐藏列
        let approvalOpinionCol= this.findObject(this.option.column, 'approvalOpinion');
        approvalOpinionCol.display=false;
        //禁止原生按钮
        this.option.emptyBtn=false;
        this.option.submitBtn=false;
        this.approvalFormTitle='撤销商议结果';
      },
      handleDialogClose(){
        //恢复原状
        this.option.column.forEach(x => {
          x.disabled=false;
        });
        let approvalOpinionCol= this.findObject(this.option.column, 'approvalOpinion');
        approvalOpinionCol.display=true;
        //回复原生按钮状态
        this.option.emptyBtn=true;
        this.option.submitBtn=true;
        //恢复审核复审状态判断值
        this.recheck=false;
        this.approvalFormTitle='';
      },
      handleSubmit(flag){
        //校验必填项
        this.$refs.formMain.validate(valid => {
            if (valid){
              let data=this.form;
              if (flag){
                data["applicationStatus"]=20;
              }else {
                data["applicationStatus"]=19;
              }
              confer(data).then(() => {
                this.formOnLoading = false;
                //隐藏抽屉
                this.drawerVisible = false;
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
          if (valid){
            let data=this.form;
            if (this.form["applicationStatus"]!=9&&this.form["applicationStatus"]!=10){
              this.$message({message:"请检查必填项",type:"warning",customClass:'topToDialogIndex'});
              this.formOnLoading = false;
              //隐藏抽屉
              this.drawerVisible = false;
              //刷新
              this.onLoad(this.page);
              return;
            }
            reConfer(data).then(() => {
              this.formOnLoading = false;
              //隐藏抽屉
              this.drawerVisible = false;
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
        if (["edit","add"].includes(type)){
          const beRequestedSid = this.findObject(this.option.column, 'beRequestedSid');
          beRequestedSid.dicData=this.coBaseNurseDict;
        }
        done();
      },
      beforeClose(done, type){
        if (["edit", "add"].includes(type)){
          const beRequestedSid = this.findObject(this.option.column, 'beRequestedSid');
          beRequestedSid.dicData=this.allBaseNurseDict;
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
