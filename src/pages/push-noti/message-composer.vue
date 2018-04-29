<style lang="scss">
</style>
<template lang="pug">
  div
    .modal-body
      form
        form-group(title="Loại tin nhắn")
          .form-check.form-check-inline
            input.form-check-input(type="radio", value="general", v-model="options.messageType")
            label.form-check-label Tin nhắn chung
          .form-check.form-check-inline
            input.form-check-input(type="radio", value="product", v-model="options.messageType")
            label.form-check-label Sản phẩm
          .form-check.form-check-inline
            input.form-check-input(type="radio", value="news", v-model="options.messageType")
            label.form-check-label Tin tức
        div(v-if="options.messageType === 'product'")
          product-selector.p-2.bg-light(v-model="options.selectedProduct", :single="true")
        form-group(title="Tiêu đề")
          input.form-control(placeholder="Tiêu đề", v-model="message.title")
        form-group(title="Nội dung")
          textarea.form-control(placeholder="Nội dung", rows="2", v-model="message.body")
          small.form-text.text-muted Nội dung càng ngắn gọn, súc tích, thu hút càng tốt :v
        form-group(title="URL")
          .input-group
            .input-group-prepend
              span.input-group-text https://
            input.form-control(placeholder="URL", v-model="message.click_action")
          small.form-text.text-muted Có thể bỏ trống
        form-group(title="Ảnh đại diện")
          .input-group
            .input-group-prepend
              span.input-group-text https://
            input.form-control(placeholder="Ảnh đại diện", v-model="message.icon")
          small.form-text.text-muted Có thể bỏ trống
        page-tabs(:hash="false")
          page-tab#schedule(title="Hẹn giờ")
            .form-group.form-check
              input.form-check-input(type="checkbox", v-model="options.isSchedule")
              label.form-check-label Hẹn giờ gửi Push Notification
            fieldset(:disabled="!options.isSchedule")
              .form-group.row
                label.col-sm-3.col-form-label Gửi sau
                .col-sm-9
                  .form-check.mb-2
                    input.form-check-input(type="radio", name="scheduleType", value="interval")
                    label.form-check-label Sau một khoảng TG xác định
                  .row.mb-3
                    .col-sm-5
                      input.form-control
                    .col-sm-4
                      select.form-control
                        option Giây
                        option Phút
                        option Giờ
                        option Ngày
                  .form-check.mb-2
                    input.form-check-input(type="radio", name="scheduleType", value="exact")
                    label.form-check-label Thời điểm chính xác
                  .row
                    .col-sm-12
                      date-time-picker(v-model="options.scheduleExact")
          page-tab#marketing(title="Marketing")
            form-group(title="Tên chiến dịch")
              input.form-control(v-model="options.utmParams.campaign", placeholder="Tên chiến dịch")
              small.form-text.text-muted Tham số <i>utm_campaign</i>
            form-group(title="Nội dung")
              input.form-control(v-model="options.utmParams.content", placeholder="Nội dung chiến dịch")
              small.form-text.text-muted Tham số <i>utm_content</i>
            form-group(title="Từ khóa")
              input.form-control(v-model="options.utmParams.term", placeholder="Từ khóa")
              small.form-text.text-muted Tham số <i>utm_term</i>
    .modal-footer
      button.btn.btn-secondary(type="button", data-dismiss="modal") Bỏ qua
      button.btn.btn-secondary(type="button", @click="$emit('created',{message, options, stored: true})") Lưu lại
      button.btn.btn-success(type="button", @click="$emit('created',{message, options, stored: false})") Lưu lại & Gửi đi
</template>
<script>
  import {DateTimePicker, ProductSelector} from "@client/components";

  export default {
    components: {
      DateTimePicker,
      ProductSelector,
      FormGroup: {
        functional: true,
        render(h, {props, children}) {
          return (
            <div class="form-group row">
              <label class="col-sm-3 col-form-label">{props.title}</label>
              <div class="col-sm-9">{children}</div>
            </div>
          )
        }
      }
    },
    data() {
      return {
        message: {
          title: '',
          body: '',
          click_action: '',
          icon: ''
        },
        options: {
          messageType: 'general',
          selectedProduct: null,
          isSchedule: false,
          scheduleType: 'exact',
          scheduleExact: '',
          utmParams: {
            campaign: '',
            content: '',
            term: ''
          }
        }
      }
    },
    watch: {
      'options.messageType': function (newVal) {
        const {options} = this;
        if (newVal === 'general') {
          options.selectedProduct = null;
        } else if (newVal === 'product') {

        }
      },
      'options.selectedProduct': function (newVal) {
        if (newVal === null) return;

        const products = this.$store.state.products.products,
          product = products.find(p => p.id * 1 === newVal * 1);

        this.message = Object.assign({}, this.message, {
          title: product.title,
          click_action: 'vaithuhay.com/products/' + product.handle,
          icon: product.images[0].src.replace(/https?:\/\//, '')
        })
      }
    }
  }
</script>
