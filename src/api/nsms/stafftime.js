import request from '@/router/axios';

export const getList = (current, size, params) => {
  return request({
    url: '/api/nsms/stafftime/list',
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
    url: '/api/nsms/stafftime/detail',
    method: 'get',
    params: {
      id
    }
  })
}

export const remove = (ids) => {
  return request({
    url: '/api/nsms/stafftime/remove',
    method: 'post',
    params: {
      ids,
    }
  })
}

export const add = (row) => {
  return request({
    url: '/api/nsms/stafftime/submit',
    method: 'post',
    data: row
  })
}

export const update = (row) => {
  return request({
    url: '/api/nsms/stafftime/submit',
    method: 'post',
    data: row
  })
}

export const calendar = (date) => {
  return request({
    url: '/api/nsms/stafftime/calender',
    method: 'get',
    params: {
      date
    }
  })
}
