(function ($) {

    let row_to_remove = ''; //global variable
    let group_info = ''; //global variable
    let selected_group;

    $(document).on('shown.bs.modal', '#delete-group-modal', function (event) {
        row_to_remove = $(event.relatedTarget);
    });

    $('#create-group-confirm').click(function () {
        let selected = $('#create-group-table').DataTable().rows({search: 'applied', selected: true}).data();

        $("#add-group-modal").scrollTop(0);
        $("html, body").scrollTop($("#add-group-modal").offset().top);

        if (!$('#group-name-input').val()) {
            $('#no-group-name-alert').show();
            setTimeout(function () {
                $('#no-group-name-alert').hide();
            }, 4000);
            return;
        }

        if (selected.length === 0) {
            $('#no-implants-selected-alert').show();
            setTimeout(function () {
                $('#no-implants-selected-alert').hide();
            }, 4000);
            return;
        }

        var request = {
            uuid: '',
            groupname: $('#group-name-input').val(),
            implants: []
        }
        implants_uuid = []
        for (var i = 0; i < selected.length; i++) {
            request.implants.push(selected[i].implant.uuid);
        }

        $.ajax({
            type: 'POST',
            url: 'http://192.168.215.138:1337/api/group',
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (msg) {
                $('#group-created-successful').show();
                setTimeout(function () {
                    $('#group-created-successful').hide();
                }, 4000);
                $('#table').DataTable().ajax.reload();
                $('#table').DataTable().searchPanes.rebuildPane();
            }
        });
    });


    $(document).on('shown.bs.modal', '#loading-modal', function (event) {
        $('#info-group-table').DataTable().clear().draw();
        var row = $(event.relatedTarget).parents("tr");
        var uuid = row.find("td:first").text();
        for (var i = 0; i < group_info.length; i++) {
            if (group_info[i].uuid == uuid) {
                selected_group = group_info[i];
                $('#info-group-table').DataTable().ajax.reload();
                $('#info-group-table').DataTable().searchPanes.rebuildPane()
                return;
            }
        }
    });

    $('#delete-group-confirm').click(function () {
        var uuid = row_to_remove.parents("tr").find("td:first").text();
        var api_url = `/api/group/${uuid}`
        $.ajax({
            url: api_url,
            type: "delete",
            success: function (response) {
                row_to_remove.parents("tr").remove();
            },
            error: function (xhr) {
                console.log("Error deleting group");
            }
        });
        $('#delete-group-modal').modal('toggle');
    });

    $('#table').DataTable({
        ajax: {
            url: "http://192.168.215.138:1337/api/group",
            dataSrc: function (json) {
                for (var i = 0; i < json.length; i++) {
                    json[i]["nummembers"] = json[i].implants.length;
                    json[i]["editbuttons"] = '<div role="group" class="btn-group btn-group-sm"><button class="btn btn-primary group-action-button" type="button" data-target="#loading-modal" data-toggle="modal"><i class="fas fa-info-circle"></i></button><button class="btn btn-danger group-action-button" type="button" data-target="#delete-group-modal" data-toggle="modal"><i class="far fa-trash-alt"></i></button><button class="btn btn-warning group-action-button edit-group-button" type="button"><i class="far fa-edit"></i></button></div>';
                }
                group_info = json;
                return json;
            },
        },
        columns: [
            {"data": "uuid"},
            {"data": "groupname"},
            {"data": "nummembers"},
            {"data": "editbuttons"},
        ],
        colReorder: true,
        dom: 'PBlfrtip',
        responsive: true,
        autoWidth: false,
        buttons: [
            'colvis'
        ],
        columnDefs: [{
            searchPanes: {
                show: true
            },
            targets: [0, 1, 2]
        }]
    });

    $('#create-group-table').DataTable({
        select: {
            style: 'multi'
        },
        buttons: [
            'selectAll',
            'selectNone',
            'colvis'
        ],
        language: {
            buttons: {
                selectAll: "Select all items",
                selectNone: "Select none"
            }
        },
        colReorder: true,
        "ajax": {
            "url": "http://192.168.215.138:1337/api/implantswithcallbacks",
            dataSrc: ""
        },
        columns: [
            {"data": "implant.uuid"},
            {"data": "implant.primaryip"},
            {"data": "implant.hostname"},
            {"data": "implanttype.implantname"},
            {"data": "implanttype.implantversion"},
            {"data": "implant.implantos"},
            {"data": "callback.lastcall"},
            {
                "data": "implant.supportedmodules",
                render: {
                    _: '[, ]',
                    sp: '[]'
                },
                searchPanes: {
                    orthogonal: 'sp'
                }
            },
        ],
        dom: 'PBlfrtip',
        responsive: true,
        autoWidth: false,
        columnDefs: [{
            searchPanes: {
                show: true,
            },
            targets: [0, 1, 2, 3, 4, 5, 6, 7]
        }]
    });

    $('#info-group-table').DataTable({
        colReorder: true,
        ajax: function (data, callback, settings) {
            var group_implants = []
            if (selected_group) {
                $("#group-name").val(selected_group.groupname);
                $("#group-uuid").val(selected_group.uuid);
                for (var j = 0; j < selected_group.implants.length; j++) {
                    $.ajax({
                        type: 'GET',
                        url: `http://192.168.215.138:1337/api/implant/${selected_group.implants[j]}`,
                        success: function (msg) {
                            group_implants.push(JSON.parse(msg));
                        },
                        error: function (resp) {
                            console.log("Error in request for implant");
                        },
                        async: false
                    });
                }
                $('#loading-modal').modal('hide')
                $('#info-group-modal').modal('show')
            }
            callback({data: group_implants})
        },
        columns: [
            {"data": "uuid"},
            {"data": "primaryip"},
            {"data": "hostname"},
            {"data": "implantos"},
            {
                "data": "supportedmodules",
                render: {
                    _: '[, ]',
                    sp: '[]'
                },
                searchPanes: {
                    orthogonal: 'sp'
                }
            },
        ],
        dom: 'Plfrtip',
        responsive: true,
        autoWidth: false,
        columnDefs: [{
            searchPanes: {
                show: true,
            },
            targets: [0, 1, 2, 3, 4]
        }]
    });

    $('#no-group-name-alert').hide();
    $('#no-implants-selected-alert').hide();
    $('#group-created-successful').hide();

    $(document).on("click", ".edit-group-button", function () {
        let groupuuid = $(this).parents("tr").find("td:first").text();
        $('#group-name-input').val($(this).parents("tr").find("td:eq(1)").text())
        $('#create-group-table').DataTable().rows('.selected').deselect();
        for (var i = 0; i < group_info.length; i++) {
            if (group_info[i].uuid == groupuuid) {
                $('#create-group-table').DataTable().searchPanes.clearSelections();
                var indexes = $('#create-group-table').DataTable().rows().eq(0).filter(function (rowIdx) {
                    return group_info[i].implants.includes($('#create-group-table').DataTable().cell(rowIdx, 0).data()) ? true : false;
                });
                $('#create-group-table').DataTable().rows(indexes).select();
                break;
            }
        }
        $('#add-group-modal').modal('show')
    });
})(jQuery); // End of use strict
