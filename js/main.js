var maxWidth = 0;
$('#table td:nth-child(3)').each(function(){
    if(maxWidth < $(this).width())
        maxWidth = $(this).width();
});

$('#table td:nth-child(3)').css('width',maxWidth);

var fixHelperModified = function(e, tr) {
    var $originals = tr.children();
    var $helper = tr.clone();
    $helper.children().each(function(index) {
        $(this).width($originals.eq(index).width()+17); // 16 - 18
    });
    return $helper;
},
    updateIndex = function(e, ui) {
        $('td.index', ui.item.parent()).each(function (i) {
            $(this).html(i + 1);
        });
    };

$("#table tbody").sortable({
    helper: fixHelperModified,
    stop: updateIndex
}).disableSelection();
/*var fixHelper = function(e, ui) {
    ui.children().each(function() {
        $(this).width($(this).width());
    });
    return ui;
};

$("#sort tbody").sortable({
    helper: fixHelper
}).disableSelection();
*/
