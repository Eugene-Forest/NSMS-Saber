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

export const getUserStaffPlan = (current, size, params) => {
  return request({
    url: '/api/nsms/stafftime/page',
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

export const remove = (objectList) => {
  return request({
    url: '/api/nsms/stafftime/remove',
    method: 'post',
    data: objectList
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

export const calender = (date) => {
  return request({
    url: '/api/nsms/stafftime/calender',
    method: 'get',
    params: {
      date
    }
  })
}

export const calenderDefault = (start,end,timeZone) => {
  return request({
    url: '/api/nsms/stafftime/calenderDefault',
    method: 'get',
    params: {
      start,end,timeZone
    }
  })
}
