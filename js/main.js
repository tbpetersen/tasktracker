var fixHelper = function(e, ui) {
    ui.children().each(function() {
        $(this).width($(this).width());
    });
    return ui;
};

$("#sort tbody").sortable({
    helper: fixHelper
}).disableSelection();

