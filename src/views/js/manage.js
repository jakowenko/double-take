/* eslint-disable no-alert */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
const $ = jQuery;

$(() => {
  $('.loading').hide();
  $('.wrapper').show();
  $('.form-select').on('change', (event) => {
    const json = $(event.currentTarget).parents('.holder').data('json');
    const folder = $(event.currentTarget).val();
    if (folder !== '' && confirm(`move and train image for ${folder}?`)) {
      $.ajax({
        url: '/train/manage/move',
        method: 'post',
        dataType: 'json',
        data: {
          folder,
          key: json.key,
          filename: json.filename,
        },
      }).done(() => {
        location.reload();
      });
    }
  });

  $('button').on('click', (event) => {
    const json = $(event.currentTarget).parents('.holder').data('json');
    if (confirm(`delete image for ${json.name}?`)) {
      $.ajax({
        url: '/train/manage/delete',
        method: 'post',
        dataType: 'json',
        data: {
          key: json.key,
        },
      }).done(() => {
        location.reload();
      });
    }
  });
});
