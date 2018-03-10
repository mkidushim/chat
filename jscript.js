// Get Categories
function getMessages(form) {
  return Promise.resolve($.ajax({
    type: "POST",
    url: baseURL+"get_messages.php",
    contentType: false,
    cache: false,
    processData: false,
    data: form
  }));
}