import request from '@/router/axios';

export const getList = (current, size, params) => {
  return request({
    url: '/api/nsms/shiftrecord/list',
    method: 'get',
    params: {
      ...params,
      current,
      size,
    }
  })
}

export const getListForApproval = (current, size, params) => {
  return request({
    url: '/api/nsms/shiftrecord/listForApproval',
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
    url: '/api/nsms/shiftrecord/detail',
    method: 'get',
    params: {
      id
    }
  })
}

export const remove = (objectList) => {
  return request({
    url: '/api/nsms/shiftrecord/remove',
    method: 'post',
    data: objectList
  })
}

export const add = (row) => {
  return request({
    url: '/api/nsms/shiftrecord/submit',
    method: 'post',
    data: row
  })
}

export const update = (row) => {
  return request({
    url: '/api/nsms/shiftrecord/submit',
    method: 'post',
    data: row
  })
}


export const checkIn = (row) => {
  return request({
    url: '/api/nsms/shiftrecord/checkIn',
    method: 'post',
    data: row
  })
}
export const recheckIn = (row) => {
  return request({
    url: '/api/nsms/shiftrecord/recheckIn',
    method: 'post',
    data: row
  })
}

export const confer = (row) => {
  return request({
    url: '/api/nsms/shiftrecord/confer',
    method: 'post',
    data: row
  })
}

export const reConfer = (row) => {
  return request({
    url: '/api/nsms/shiftrecord/reConfer',
    method: 'post',
    data: row
  })
}
