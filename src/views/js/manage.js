/* eslint-disable no-alert */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
const $ = jQuery;

const updateDisabledAttr = () => {
  const $trainBtn = $('.btn-train');
  const $deleteBtn = $('.btn-delete');

  if ($('.file-wrapper.active').length === 0) {
    $trainBtn.text(`train`).prop('disabled', true);
    $deleteBtn.text(`delete`).prop('disabled', true);
  } else {
    $trainBtn.prop('disabled', false);
    $deleteBtn.prop('disabled', false);
  }
};

$(() => {
  $('.lazy').Lazy({
    scrollDirection: 'vertical',
    visibleOnly: true,
    delay: 250,
    effect: 'fadeIn',
    effectTime: 500,
    afterLoad: (element) => {
      $(element).parent().find('.spinner-border').hide();
      $(element).addClass('img-thumbnail');
    },
  });

  $('.btn-all').on('click', (event) => {
    if ($(event.currentTarget).hasClass('active')) {
      $(event.currentTarget).text('select all');
      $('.file-wrapper').find('.active-filter').removeClass('show');
      $('.file-wrapper').removeClass('active');
    } else {
      $(event.currentTarget).text('unselect all');
      $('.file-wrapper').find('.active-filter').addClass('show');
      $('.file-wrapper').addClass('active');
    }

    $(event.currentTarget).toggleClass('active');

    updateDisabledAttr();
  });

  $('.btn-train, .btn-delete').on('click', (event) => {
    const folder = $('.form-select').val();
    const count = $('.file-wrapper.active').length;
    const fileString = count > 1 ? 'files' : 'file';
    const type = $(event.currentTarget).hasClass('btn-train') ? 'train' : 'delete';
    const message =
      type === 'train'
        ? `train ${count} ${fileString} for ${folder}?`
        : `delete ${count} ${fileString}?`;

    if (type === 'train' && folder === '') {
      alert('please select a name');
      return;
    }

    if (!confirm(message)) {
      return;
    }

    const data = [];
    $('.file-wrapper.active').each((item) => {
      const json = $('.file-wrapper.active').eq(item).data('json');
      if (type === 'train') {
        data.push({
          folder,
          key: json.key,
          filename: json.filename,
        });
      }

      if (type === 'delete') {
        data.push({
          key: json.key,
        });
      }
    });

    $.ajax({
      url: type === 'train' ? '/train/manage/move' : '/train/manage/delete',
      method: 'post',
      dataType: 'json',
      data: { files: JSON.stringify(data) },
    }).done(() => {
      $('.file-wrapper.active').addClass('inactive');
      $('.btn-train, .btn-delete').prop('disabled', true);
    });
  });

  $('.file-wrapper img').on('click', (event) => {
    if ($(event.currentTarget).parents('.file-wrapper').hasClass('inactive')) return;
    $(event.currentTarget).parents('.file-wrapper').toggleClass('active');
    $(event.currentTarget).parents('.file-wrapper').find('.active-filter').toggleClass('show');

    updateDisabledAttr();
  });
});
