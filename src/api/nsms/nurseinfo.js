import request from '@/router/axios';

export const getList = (current, size, params) => {
  return request({
    url: '/api/nsms/nurseinfo/list',
    method: 'get',
    params: {
      ...params,
      current,
      size,
    }
  })
}

export const getDetail = (id) => {
  return request({
    url: '/api/nsms/nurseinfo/detail',
    method: 'get',
    params: {
      id
    }
  })
}

export const remove = (ids) => {
  return request({
    url: '/api/nsms/nurseinfo/remove',
    method: 'post',
    params: {
      ids,
    }
  })
}

export const add = (row) => {
  return request({
    url: '/api/nsms/nurseinfo/submit',
    method: 'post',
    data: row
  })
}

export const update = (row) => {
  return request({
    url: '/api/nsms/nurseinfo/submit',
    method: 'post',
    data: row
  })
}

export const getUserIdAndName = () => {
  return request({
    url: '/api/nsms/nurseinfo/getUserIdAndName',
    method: 'get',
  })
}

// 获取同部门所有护理人员（护士、助手、护士长）的信息
export const selectAllCo = () => {
  return request({
    url: '/api/nsms/nurseinfo/selectAllCo',
    method: 'get',
  })
}

// 同部门所有护士长下拉列表
export const selectHeadNurses = () => {
  return request({
    url: '/api/nsms/nurseinfo/selectHeadNurses',
    method: 'get',
  })
}

// 同部门所有护士长下拉列表（除了自己）
export const selectHeadNurse = () => {
  return request({
    url: '/api/nsms/nurseinfo/selectHeadNurse',
    method: 'get',
  })
}

// 同部门所有护士助手下拉列表
export const selectAllBaseNurses = () => {
  return request({
    url: '/api/nsms/nurseinfo/selectNurses',
    method: 'get',
  })
}

// 同部门同事下拉列表(除了自己)
export const selectCoWorkers = () => {
  return request({
    url: '/api/nsms/nurseinfo/selectCoWorker',
    method: 'get',
  })
}









