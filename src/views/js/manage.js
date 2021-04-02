/* eslint-disable no-alert */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
const $ = jQuery;

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

  $('.btn-train, .btn-delete').on('click', (event) => {
    const folder = $('.form-select').val();
    const count = $('.file-wrapper img.active').length;
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
    $('.file-wrapper img.active').each((item) => {
      const json = $('.file-wrapper img.active').eq(item).parents('.file-wrapper').data('json');
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
      $('.file-wrapper img.active').parents('.file-wrapper').addClass('inactive');
      $('.btn-train, .btn-delete').prop('disabled', true);
    });
  });

  $('.file-wrapper img').on('click', (event) => {
    if ($(event.currentTarget).parents('.file-wrapper').hasClass('inactive')) return;
    $(event.currentTarget).toggleClass('active');
    $(event.currentTarget).parents('.file-wrapper').find('.active-filter').toggleClass('show');

    const count = $('.file-wrapper img.active').length;

    const $trainBtn = $('.btn-train');
    const $deleteBtn = $('.btn-delete');

    if (count === 0) {
      $trainBtn.text(`train`).prop('disabled', true);
      $deleteBtn.text(`delete`).prop('disabled', true);
    } else {
      $trainBtn.prop('disabled', false);
      $deleteBtn.prop('disabled', false);
    }
  });
});
