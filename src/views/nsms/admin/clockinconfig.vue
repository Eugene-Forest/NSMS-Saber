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
                   icon="el-icon-circle-plus-outline"
                   plain
                   v-if="permission.clockinconfig_add"
                   @click="createNewClockInConfig">自动生成一条打卡配置
        </el-button>
        <el-button type="danger"
                   size="small"
                   icon="el-icon-delete"
                   plain
                   v-if="permission.clockinconfig_delete"
                   @click="handleDelete">删 除
        </el-button>
      </template>

      <template slot="state" slot-scope="{row}">
        <el-tag effect="plain" type="danger" v-show="row.state==0">未启用</el-tag>
        <el-tag effect="plain" type="success" v-show="row.state==1">启用</el-tag>
      </template>

      <template slot-scope="{row,index}" slot="menu">
        <el-button
                   icon="el-icon-view"
                   size="small"
                   @click="rowViewOrEdit(row,index,true)">查看</el-button>
        <el-button
                   icon="el-icon-edit"
                   size="small"
                   @click="rowViewOrEdit(row,index,false)">编辑</el-button>
<!--        <el-button type="success"-->
<!--                   icon="el-icon-delete"-->
<!--                   size="small"-->
<!--                   @click="$refs.crud.rowView(row,index)">删除</el-button>-->
      </template>
    </avue-crud>

<!--    用来显示二维码的弹窗-->
    <el-dialog
      title="生成一条打卡配置"
      size="1200px"
      append-to-body
      :destroy-on-close="true"
      @close="handleDialogClose"
      :visible.sync="dialogVisible">
<!--      <img :src="dataOfRQCode" alt="二维码">-->


      <div class="rq">
        <el-row :gutter="20">
          <el-col :span="18">
            <avue-form v-if="dialogVisible" :option="option" v-model="form" ref="formMain">

            </avue-form>
          </el-col>
          <el-col :span="6">
            <el-card :body-style="{ padding: '0px' }" style="box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)">
              <img :src="dataOfRQCode" class="image" alt="打卡二维码">
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12" :offset="8">
            <el-button type="warning"
                       size="small"
                       icon="el-icon-save"
                       plain
                       v-if="permission.clockinconfig_add"
                       @click="handleSave(true)">保 存 并 启 用
            </el-button>
            <el-button type="success"
                       size="small"
                       icon="el-icon-save"
                       plain
                       v-if="permission.clockinconfig_add"
                       @click="handleSave(false)">保 存
            </el-button>
            <el-button type="danger"
                       size="small"
                       icon="el-icon-close"
                       plain
                       @click="handleDialogClose">取 消
            </el-button>
          </el-col>
        </el-row>
      </div>
    </el-dialog>

    <el-drawer
      :title="drawerTitle"
      size="1200px"
      append-to-body
      :destroy-on-close="true"
      @close="handleDrawerClose"
      :visible.sync="drawerVisible">
      <!--      <img :src="dataOfRQCode" alt="二维码">-->


      <div class="rq">
        <el-row :gutter="20">
          <el-col :span="18">
            <avue-form v-if="drawerVisible" :option="option" v-model="form" ref="formMain">

            </avue-form>
          </el-col>
          <el-col :span="6">
            <el-card :body-style="{ padding: '0px' }" style="box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)">
              <img :src="dataOfRQCode" class="image" alt="打卡二维码">
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12" :offset="8">
            <el-button type="warning"
                       size="small"
                       icon="el-icon-save"
                       plain
                       v-if="permission.clockinconfig_edit&&this.drawerEdit"
                       @click="saveEdit">保 存 修 改
            </el-button>
            <el-button type="danger"
                       size="small"
                       icon="el-icon-close"
                       plain
                       @click="handleDrawerClose">取 消
            </el-button>
          </el-col>
        </el-row>
      </div>
    </el-drawer>
  </basic-container>
</template>


<script>
import {
  getList,
  getDetail,
  add,
  update,
  remove,
  getRQCodeRandomly,
  submitVo,
  getRQCodeByMessage
} from "@/api/nsms/clockinconfig";
import {mapGetters} from "vuex";
import {selectByUser} from "@/api/system/dept";
import dayjs from "dayjs";

dayjs().format()

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
        dataOfRQCode:"",
        messageOfRQCode:"",
        selectionList: [],
        dialogVisible:false,
        drawerVisible:false,
        drawerEdit:false,
        drawerTitle:"",
        option: {
          height: 'auto',
          calcHeight: 210,
          searchShow: true,
          searchMenuSpan: 6,
          tip: false,
          border: true,
          index: true,
          addBtn:false,
          viewBtn:false,
          editBtn:false,
          delBtn:false,
          selection: true,
          column: [
            {
              label: "科室",
              prop: "deptId",
              type: "tree",
              span: 24,
              dicData: [],
              dicUrl: "/api/blade-system/dept/tree",
              props: {
                label: 'title',
                value: 'key'
              },
            },
            {
              label: "是否启用",
              prop: "state",
              span: 24,
              rules: [{
                required: true,
                message: "请输入是否启用",
                trigger: "blur"
              }]
            },
            {
              label: "打卡字符串",
              prop: "message",
              span: 24,
            },
            {
              label: "有效时长(分钟)",
              prop: "effectiveTime",
              span: 24,
              type: "number",
              formatter:(val,value,label)=>{
                //获取比较时间
                const startTime=dayjs(val.createTime);
                const endTime=dayjs(val.clockInDate);
                return endTime.diff(startTime,"minute")
              },
              rules: [{
                required: true,
                message: "请输入是否启用",
                trigger: "blur"
              }]
            },
            {
              label: "开始时间",
              prop: "createTime",
              span: 24,
              type: "date",
              format: 'yyyy-MM-dd HH:mm',
              valueFormat: 'yyyy-MM-dd HH:mm',
            },
            {
              label: "截止时间",
              prop: "clockInDate",
              span: 24,
              type: "date",
              format: 'yyyy-MM-dd HH:mm',
              valueFormat: 'yyyy-MM-dd HH:mm',
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
          addBtn: this.vaildData(this.permission.clockinconfig_add, false),
          viewBtn: this.vaildData(this.permission.clockinconfig_view, false),
          delBtn: this.vaildData(this.permission.clockinconfig_delete, false),
          editBtn: this.vaildData(this.permission.clockinconfig_edit, false)
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
    methods: {
      init(){
        //初始化，字典的获取..
      },
      createNewClockInConfig(){
        this.dialogVisible=true;
        getRQCodeRandomly().then(res => {
          this.dataOfRQCode=res.data.data.rq;
          this.messageOfRQCode=res.data.data.message;
          //赋值
          this.form.message=res.data.data.message;
        }, error => {
          this.$message({
            type: "error",
            message: "操作失败!"
          });
        });
        selectByUser().then(res=>{
          this.form.deptId=res.data.data;
        });
        //隐藏
        let createTime = this.findObject(this.option.column, 'createTime');
        createTime.display=false;
        let clockInDate = this.findObject(this.option.column, 'clockInDate');
        clockInDate.display=false;
        let state = this.findObject(this.option.column, 'state');
        state.display=false;
        let deptId = this.findObject(this.option.column, 'deptId');
        deptId.disabled=true;
        let message = this.findObject(this.option.column, 'message');
        message.disabled=true;
        //禁止原生按钮
        this.option.emptyBtn=false;
        this.option.submitBtn=false;
      },
      handleSave(flag){
        //先校验
        this.$refs.formMain.validate(valid => {
            if (valid){
              //判断保存类型
              if (flag){
                this.form.state=1;
              }else {
                this.form.state=0;
              }
              let data=this.form;
              submitVo(data).then(() => {
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
      handleDialogClose(){
        console.log("close dialog")
        this.dialogVisible=false;
        //清空
        this.form={};
        //恢复显示
        this.option.column.forEach(x => {
          x.display=true;
          x.disabled=false;
        });
        //恢复原生按钮
        this.option.emptyBtn=true;
        this.option.submitBtn=true;
      },
      rowViewOrEdit(row,index,flag){
        getDetail(row.id).then(res=>{
          this.form=res.data.data;
        })
        this.drawerVisible=true;
        this.drawerTitle="查看";
        getRQCodeByMessage(row.message).then(res=>{
          this.dataOfRQCode=res.data.data.rq
        });
        //隐藏
        let effectiveTime = this.findObject(this.option.column, 'effectiveTime');
        effectiveTime.display=false;
        //恢复原生按钮
        this.option.emptyBtn=false;
        this.option.submitBtn=false;
        if (flag){
          //禁止编辑
          this.option.column.forEach(x => {
            x.disabled=true;
          });
          this.drawerEdit=false;
        }else {
          let deptId = this.findObject(this.option.column, 'deptId');
          deptId.disabled=true;
          let message = this.findObject(this.option.column, 'message');
          message.disabled=true;
          let createTime = this.findObject(this.option.column, 'createTime');
          createTime.disabled=true;
          this.drawerEdit=true;
        }
      },
      saveEdit(){
        let data=this.form;
        this.$refs.formMain.validate(valid => {
          if (valid) {
            update(data).then(() => {
              //隐藏抽屉
              this.handleDrawerClose();
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
      handleDrawerClose(){
        this.form={};
        this.drawerTitle="";
        this.drawerVisible=false;
        this.drawerEdit=false;
        //恢复原生按钮
        this.option.emptyBtn=true;
        this.option.submitBtn=true;
        //允许编辑和显示
        this.option.column.forEach(x => {
          x.disabled=false;
          x.display=true;
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
  .rq{
    background-color: #f9fafc;
  }
  .image {
    width: 100%;
    display: block;
  }


</style>
