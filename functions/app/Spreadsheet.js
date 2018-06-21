import credentials               from '../../server/jobs/hungphongbk-02e62197a93f';
import {google as googleapis}    from 'googleapis';
import moment                    from 'moment-timezone';
//import omit from 'lodash/omit'
import cloneDeep                 from 'lodash/cloneDeep';
import zip                       from 'lodash/zip';
import clone                     from 'lodash/clone';
//import flatten from 'lodash/flatten'
import sortedIndexOf             from 'lodash/sortedIndexOf';
import {apiGet}                  from './utils';
import get                       from "lodash/get";
import memoize                   from 'async-decorators/memoize';
import {promisify}               from 'bluebird';
import {remove as removeAccents} from 'diacritics';
import create                    from 'lodash/create';
import min                       from 'lodash/min';
import max                       from 'lodash/max';
import stringHash                from 'string-hash';

const sheets = googleapis.sheets('v4');
const joinKeys = (prefix, obj) => {
  const rs = {};
  for (const [key, value] of Object.entries(obj)) {
    rs[prefix + key] = value;
  }
  return rs;
};
const _mapHeader = {
  'order_number': 'Mã đơn hàng',
  'number': 'Id',
  'email': 'Email',
  'financial_status': 'Tình trạng thanh toán',
  'transactions[0].created_at': 'Thời gian thanh toán',
  'transactions[0].user_id': 'Người xác nhận thanh toán',
  'fulfillment_status': 'Tình trạng giao hàng',
  'currency': 'Tiền tệ',
  'subtotal_price': 'Tổng tiền',
  'shipping_lines[0].price': 'Phí vận chuyển',
  'shipping_lines[0].code': 'Phương thức vận chuyển',
  'total_price': 'Tổng cộng',
  'total_discounts': 'Số tiền giảm',
  'created_at': 'Ngày đặt hàng',
  ...joinKeys('line_items[0].', {
    'quantity': 'Số lượng sản phẩm',
    'name': 'Tên sản phẩm',
    'price': 'Giá bán',
    'price_original': ' Giá gốc',
    'sku': 'Mã sản phẩm'
  }),
  ...joinKeys('billing_address.', {
    'name': 'Tên người thanh toán',
    'address1': 'Billing Street',
    'province': 'Tỉnh/TP thanh toán',
    'country': 'Quốc gia',
    'phone': 'Số điện thoại thanh toán',
  }),
  ...joinKeys('shipping_address.', {
    'name': 'Tên người nhận',
    'address1': 'Shipping Street',
    'ward': 'Phường/Xã nhận hàng',
    'district': 'Quận/Huyện nhận hàng',
    'province': 'Tỉnh/TP nhận hàng',
    'country': 'Quốc gia nhận hàng',
    'phone': 'Số điện thoại',
  }),
  ...joinKeys('fulfillments[0].', {
    'tracking_number': 'Mã vận đơn',
    'carrier_status_name': 'Trạng thái vận chuyển',
    'cod_amount': 'Số tiền thu hộ',
    'carrier_cod_status_name': 'Tình trạng thu hộ'
  }),
  'note': 'Ghi chú',
  'cancelled_at': 'Ngày hủy',
  'refunds[0].user_id': 'Người hủy',
  'cancelled_status': 'Trạng thái hủy',
  'gateway': 'Phương thức thanh toán',
  'tags': 'Tags',
  'source_name': 'Kênh bán hàng',
  'referring_site': 'Trang dẫn tới',
  'user_id': 'Người tạo',
  'confirmed_at': 'Ngày xác thực',
  'discount_codes[0].code': 'Mã khuyến mãi',
  groupA_row: ['GroupA', index => `=iferror(VLOOKUP(T${index};'Item list (lnk)'!A:F;5;0))`],
  promotion_row: ['Promotion', index => `=if(S${index}>0;(S${index}-R${index})*P${index};)`],
  stock_row: ['Trạng thái xuất kho', index => `=IFERROR(VLOOKUP(A${index};'Dispatch (lnk)'!C:D;2;0);)`],
  hash_row: ['Hash Validation', (_, hash) => hash]
};
const hash = (number, productId = '') => stringHash(number.trim() + '@' + (typeof productId === 'number' ? productId : productId.trim()));
const randomlyFn = (fn, probability = 0.4) => {
    if (Math.random() <= probability)
      fn();
  },
  logger = (isEnable = process.env.NODE_ENV !== 'production') => (target, key, descriptor) => {
    const original = descriptor.value;
    descriptor.value = function (...args) {
      const self = this,
        newThis = create(self, {
          log(msg, ...args2) {
            if (self.hasOwnProperty('logs'))
              self.logs.push(`{${key}}: ${msg}`);
            if (isEnable)
              console.log.apply(null, [`{${key}}: ${msg}`, ...args2]);
          }
        });
      return original.apply(newThis, args);
    };
    return descriptor;
  };

async function getValue(_obj, key) {
  //if key is extra field
  //return callback
  if (/_row$/.test(key))
    return _mapHeader[key][1];

  //else
  const val = get(_obj, key);
  if ((typeof val === 'undefined') || (val === null)) return '';
  if (/confirmed_at$/.test(key)) {
    if (typeof val !== 'string') return "";
    const m = moment(val);
    // console.log([val, 'UTC' + m.utcOffset() / 60, 'hour = ' + m.hour()].join(' | '));
    return m.format('DD-MM-YYYY');
  }
  if (/_at$/.test(key)) {
    if (typeof val !== 'string') return "";
    const m = moment(val);
    // console.log([val, 'UTC' + m.utcOffset() / 60, 'hour = ' + m.hour()].join(' | '));
    return m.format('DD-MM-YYYY HH:MM:SS');
  }
  switch (key) {
    case 'financial_status':
      return {
        pending: 'Chờ xử lý',
        voided: 'Đã hủy',
        refunded: 'Đã nhập trả',
        paid: 'Đã thanh toán'
      }[val];
    case 'fulfillment_status':
      return val === 'notfulfilled' ? 'Chưa hoàn thành' : 'Đã hoàn thành';
    case 'cancelled_status':
      return /un/.test(val) ? 'No' : 'Yes';
    case 'transactions[0].user_id':
    case 'user_id':
    case 'refunds[0].user_id':
      if (val * 1 === 0) return "";
      const {users} = await apiGet('/admin/users.json'),
        user = users.find(u => u.id * 1 === val * 1);
      if (user) return user.last_name.trim() + ' ' + user.first_name.trim();
      else return "";
    default:
      return val.toString();
  }
}


/**
 * INPUT: raw-data của đơn hàng
 */
class Spreadsheet {
  constructor() {
    const polyfill = apiFn => {
      return (...args) => apiFn.apply(null, args)
        .then(result => {
          if (typeof result.values === 'undefined')
            result.values = result.data.values;
          return result;
        });
    };

    this.spreadsheetId = '1n3H8FNUmAHEtoViNqGevOuESHAwitGdBOuf92YkjuDI'; //for production
    //this.spreadsheetId = '14rY5RLRjDNYKl2WSHten0sIA5xNGNdb6uJcpaHeHXYE'; //for testing
    this.rowOffset = 4000;
    this.columnLastIndex = 'AT';
    this.spreadsheets = {
      values: {
        get: sheets.spreadsheets.values.get,
        batchGet: sheets.spreadsheets.values.batchGet,
        update: sheets.spreadsheets.values.update,
        batchUpdate: sheets.spreadsheets.values.batchUpdate,
        append: sheets.spreadsheets.values.append
      }
    };
    const spreadSheetFns = this.spreadsheets.values;
    for (const fn of Object.keys(spreadSheetFns)) {
      if (spreadSheetFns.hasOwnProperty(fn)) {
        spreadSheetFns[fn] = polyfill(promisify(spreadSheetFns[fn]));
      }
    }
    this.logs = [];
  }

  @memoize()
  async _makeAuth() {
    console.log('create auth');
    const jwt = new googleapis.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      [
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      null
    );
    try {
      await jwt.authorize();
      return jwt;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Util to make request parameters to GoogleSpreadsheetAPI
   * @param params
   * @param sheet
   * @returns {Promise<{auth, spreadsheetId: string}>}
   * @private
   */
  async _params(params, sheet = 'Order data') {
    // deep-determine 'range' or 'ranges'
    const deep = obj => {
      for (const key in Object.keys(obj)) {
        if (key === 'range' && typeof obj.range !== 'undefined')
          obj.range = sheet + '!' + obj.range;
        else if (key === 'ranges' && typeof obj.ranges !== 'undefined') {
          obj.ranges = obj.ranges.map(r => sheet + '!' + r);
        } else if (typeof obj[key] === 'object')
          deep(obj[key]);
      }
    };
    deep(params);

    return {
      auth: await this._makeAuth(),
      spreadsheetId: this.spreadsheetId,
      ...params
    };
  }

  @memoize()
  async _cacheHeaders() {
    const headers = [];
    const result = await this.spreadsheets.values.get(await this._params({
      range: `A1:${this.columnLastIndex}1`
    }));
    const labels = result.values[0].map(removeAccents);
    console.log(labels.join(', '));

    for (const [key, _label] of Object.entries(_mapHeader)) {
      let label = _label;

      if (Array.isArray(label)) label = label[0];
      label = removeAccents(label.trim());
      let index = labels.indexOf(label);
      //console.log(`${label} has index ${index}`);
      if (index >= 0)
        headers[key] = index;
    }
    //console.log(headers);
    return headers;
  }

  @logger()
  async createRow() {
    const self = this,
      headers = await this._cacheHeaders(),
      row = [];
    for (const [path, index] of Object.entries(headers)) {
      Object.defineProperty(row, path, {
        get() {
          return row[index];
        },
        set(value) {
          let v = value;
          if (typeof v === 'string') {
            v = v.trim();
            if (/^[0-9]+$/.test(v))
              v = v * 1;
          }
          row[index] = v;
        }
      });
    }
    Object.defineProperties(row, {
      rowHash: {
        get() {
          return hash(this.order_number, this['line_items[0].name']);
        }
      }
    });

    return row;
  }

  /**
   * Cache only unique rows (A, T and AD) into {number, productId, id}
   * @returns {Promise<void>}
   * @private
   */
  @logger(false)
  async _cacheSheetData(_start = null, end = '') {
    const start = _start ? _start : this.rowOffset;

    const params = await this._params({
      range: `A${start}:AQ${end}`,
      majorDimension: 'COLUMNS'
    });
    const result = await this.spreadsheets.values.get(params),
      data = result.values;

    const numbers = data[0],
      productIds = data[16];

    this.log(`Cache sheet data returned ${numbers.length}:${productIds.length} rows`);

    return zip(numbers, productIds).map(([number, productId], rowIndex) => ({
      rowIndex: rowIndex + this.rowOffset,
      number,
      productId,
      hash: hash(number, productId)
    }))
      .sort((p1, p2) => {
        if (p1.hash < p2.hash) return -1;
        if (p1.hash > p2.hash) return 1;
        return 0;
      });
  }

  /**
   * Transform order => multiple rows by product ID
   * @param order
   * @returns {Array}
   * @private
   */
  async _makeOrderRows(order) {
    const headers = await this._cacheHeaders();
    const rows = [];
    for (const line_item of order.line_items) {
      const row = await this.createRow(),
        orderCopy = cloneDeep(order);
      orderCopy.line_items = [line_item];
      for (const path of Object.keys(headers)) {
        row[path] = await getValue(orderCopy, path);
      }
      rows.push(row);
    }
    return rows;
  }

  /**
   * 1. Find matched rows (completed)
   * 2. Split rows into 2 types: update/append
   *
   * @param orders
   * @returns {Promise<{updateBody: any[], appendBody: Array}>}
   */
  @logger(false)
  async _makeBody(orders) {
    //generate matched rows
    const generate = (async () => {
      const rows = [];
      for (const order of orders) {
        rows.push(...await this._makeOrderRows(order));
      }
      return rows;
    })();

    //split rows into 2 types
    const [rows, sheetData] = await Promise.all([
        generate,
        this._cacheSheetData()
      ]),
      sheetDataHash = sheetData.map(row => row.hash),
      updateList = [],
      appendList = [];

    (rs => {
      rs.map(r => {
        this.log('from sheet data: ' + r.productId + ', hash = ' + r.hash);
      });
    })(sheetData.filter(row => row.number === '#113424'));

    //define fn: add extra fields!
    let sheetDataLastIndex = sheetData.length + this.rowOffset;
    rows.forEach(row => {
      let index;
      if (row['order_number'] === '#113424') {
        this.log('from haravan: ' + row['line_items[0].name'] + ', hash = ' + row.rowHash);
      }
      if ((index = sortedIndexOf(sheetDataHash, row.rowHash)) >= 0) {
        const sheetDataRow = sheetData[index];

        //transform extra fields to value
        for (const i in row)
          if (row.hasOwnProperty(i) && (typeof row[i] === 'function'))
            row[i] = row[i](sheetDataRow.rowIndex, sheetDataRow.hash);

        updateList.push({
          sheetDataRow,
          row
        });
      } else {

        //transform extra fields to value
        for (const i in row)
          if (row.hasOwnProperty(i) && (typeof row[i] === 'function'))
            row[i] = row[i](sheetDataLastIndex, row.rowHash);
        sheetDataLastIndex++;
        appendList.push(row);
      }
    });

    // with "update" group
    // split in into adjacent blocks by item.sheetDataRow.rowIndex
    // algorithm: sort by item.sheetDataRow.rowIndex
    updateList.sort((p1, p2) => p1.sheetDataRow.rowIndex - p2.sheetDataRow.rowIndex);
    const updateGroupedList = [],
      lastGroup = () => updateGroupedList[updateGroupedList.length - 1],
      lastItemInLastGroup = () => {
        const g = lastGroup();
        return g[g.length - 1];
      };
    updateList.forEach(item => {
      if (typeof lastGroup() === 'undefined')
        updateGroupedList.push([item]);
      else if (Math.abs(item.sheetDataRow.rowIndex - lastItemInLastGroup().sheetDataRow.rowIndex) === 1)
        lastGroup().push(item);
      else updateGroupedList.push([item]);
    });
    //grouped to multiple ranges
    const updateBody = updateGroupedList.map(group => {
      const rowIndexes = group.map(i => i.sheetDataRow.rowIndex),
        fromRow = min(rowIndexes),
        toRow = max(rowIndexes),
        range = `A${fromRow}:${this.columnLastIndex}${toRow}`;
      this.log(`\tWill be updated in range ${range}`);
      return {
        range,
        values: group.map(r => r.row)
      };
    });

    return {
      updateBody,
      appendBody: appendList
    };
  }

  @logger()
  async write(orders = []) {
    const {updateBody, appendBody} = await this._makeBody(orders);
    console.log(updateBody.length + ' row-blocks will be updated');
    console.log(appendBody.length + ' rows will be appended');
    if (updateBody.length > 0)
      await this.spreadsheets.values.batchUpdate(await this._params({
        resource: {
          data: updateBody,
          valueInputOption: 'USER_ENTERED'
        }
      }));
    if (appendBody.length > 0)
      await this.spreadsheets.values.append(await this._params({
        valueInputOption: 'USER_ENTERED',
        range: `A${this.rowOffset}:${this.columnLastIndex}`,
        resource: {
          values: appendBody
        }
      }));
  }

  emitLog(): Array<string> {
    const rs = clone(this.logs);
    this.logs = [];
    return rs;
  }
}


export default new Spreadsheet();
