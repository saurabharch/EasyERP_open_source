define([
        'Backbone',
        'Underscore',
        'jQuery',
        'text!templates/myProfile/UsersPagesTemplate.html',
        'text!templates/myProfile/ChangePassword.html',
        'common',
        'models/UsersModel',
        'dataService',
        'populate'
    ],
    function (Backbone, _, $, UsersPagesTemplate, ChangePassword, common, UsersModel, dataService, populate) {
        'use strict';
        var ContentView = Backbone.View.extend({
            el         : '#content-holder',
            contentType: "myProfile",
            actionType : "Content",
            template   : _.template(ChangePassword),
            imageSrc   : '',

            initialize: function (options) {
                this.startTime = options.startTime;
                this.render();
                this.responseObj = {};
            },

            events: {
                "click .changePassword"                                           : "changePassword",
                "mouseenter .avatar"                                              : "showEdit",
                "mouseleave .avatar"                                              : "hideEdit",
                "click #resetBtn"                                                 : "resetForm",
                "click #saveBtn"                                                  : "save",
                "click #relatedEmployee li > a"                                   : "gotoEmployeesForm",
                "click"                                                           : "hideNewSelect",
                "click .current-selected"                                         : "showNewSelect",
                "click .newSelectList li:not(.miniStylePagination)"               : "chooseOption",
                "click .newSelectList li.miniStylePagination"                     : "notHide",
                "click .newSelectList li.miniStylePagination .next:not(.disabled)": "nextSelect",
                "click .newSelectList li.miniStylePagination .prev:not(.disabled)": "prevSelect"

            },

            showNewSelect: function (e, prev, next) {
                populate.showSelect(e, prev, next, this);
                return false;

            },

            notHide: function () {
                return false;
            },

            hideNewSelect: function () {
                $(".newSelectList").hide();
            },

            chooseOption: function (e) {
                $(e.target).parents("dd").find(".current-selected").text($(e.target).text()).attr("data-id", $(e.target).attr("id"));
            },

            nextSelect: function (e) {
                this.showNewSelect(e, false, true);
            },

            prevSelect: function (e) {
                this.showNewSelect(e, true, false);
            },

            changePassword: function (e) {
                e.preventDefault();

                var formString = this.template();
                var self = this;

                this.$el = $(formString).dialog({
                    dialogClass  : "change-password-dialog",
                    width        : "500px",
                    title        : "Change Password",
                    closeOnEscape: false,
                    autoOpen     : true,
                    resizable    : true,
                    buttons      : {
                        save  : {
                            text : "Save",
                            class: "btn",
                            click: function () {
                                self._changePassword(self);
                            }
                        },
                        cancel: {
                            text : "Cancel",
                            class: "btn",
                            click: function () {
                                self.hideDialog();
                            }
                        }
                    }
                });
            },

            _changePassword: function (self) {
                var oldpass = $.trim(this.$el.find('#old_password').val());
                var pass = $.trim(this.$el.find('#new_password').val());
                var confirmPass = $.trim(this.$el.find('#confirm_new_password').val());

                dataService.getData('/currentUser', null, function (response, context) {
                    var mid = 39;

                    context.UsersModel = new UsersModel(response.user);
                    context.UsersModel.urlRoot = '/currentUser';
                    context.UsersModel.save({
                            oldpass: oldpass,
                            pass   : pass
                        },
                        {
                            headers    : {
                                mid: mid
                            },
                            wait       : true,
                            patch      : true,
                            success    : function (/*model*/) {
                                self.hideDialog();
                            },
                            error      : function (model, xhr) {
                                self.errorNotification(xhr);
                            },
                            editMode   : false,
                            confirmPass: confirmPass
                        });
                }, this);

            },

            save: function (e) {
                e.preventDefault();
                var ids = [];
                var email = $.trim($("#email").val());
                var login = $.trim($("#login").val());
                var relatedEmployee = $("input[type='radio']:checked").attr("data-id");

                if (relatedEmployee) {
                    ids.push(relatedEmployee);
                } else {
                    relatedEmployee = null;
                }

                dataService.getData('/currentUser', null, function (response, context) {
                    var self = this;
                    var mid = 39;
                    var user = response.user;
                    var _login = user.login;

                    context.UsersModel = new UsersModel(user);
                    context.UsersModel.urlRoot = '/currentUser';

                    context.UsersModel.set({
                        email          : email,
                        login          : login,
                        relatedEmployee: relatedEmployee
                    });

                    context.UsersModel.save(context.UsersModel.changedAttributes(), {
                        headers : {
                            mid: mid
                        },
                        patch   : true,
                        wait    : true,
                        success : function (model) {
                            if (relatedEmployee) {
                                common.getImages(ids, '/getEmployeesImages', function (response) {
                                    // App.currentUser.imageSrc = response.data[0].imageSrc;
                                    $("#loginPanel .iconEmployee").attr("src", response.data[0].imageSrc);
                                    $("#loginPanel #userName").text(response.data[0].fullName);
                                });
                            } else {
                                $("#loginPanel .iconEmployee").attr("src", model.toJSON().imageSrc);
                                $("#loginPanel  #userName").text(model.toJSON().login);
                            }
                            Backbone.history.fragment = "";
                            Backbone.history.navigate("easyErp/myProfile", {trigger: true});
                        },
                        error   : function (model, xhr) {
                            self.errorNotification(xhr);
                        },
                        editMode: true
                    });
                }, this.render());
            },

            resetForm: function (e) {
                e.preventDefault();
                $(':input', '#createUserForm')
                    .not(':button, :submit, :reset, :hidden')
                    .val('')
                    .removeAttr('checked');
            },

            showEdit: function () {
                $(".upload").animate({
                    height : "20px",
                    display: "block"
                }, 250);

            },
            hideEdit: function () {
                $(".upload").animate({
                    height : "0px",
                    display: "block"
                }, 250);

            },

            hideDialog: function () {
                $(".change-password-dialog").remove();
            },

            gotoEmployeesForm: function (e) {
                e.preventDefault();
                var itemIndex = $(e.target).closest("a").attr("id");
                window.location.hash = "#easyErp/Employees/form/" + itemIndex;
            },

            render: function () {
                dataService.getData('/currentUser', null, function (response, context) {
                    dataService.getData('/getForDdByRelatedUser', null, function (relatedEmployee) {
                        var date = new Date();
                        var minutes = date.getTimezoneOffset();
                        var timezone;
                        var model;

                        if (minutes < 0) {
                            timezone = ("UTC +" + (minutes / 60) * (-1));
                        } else {
                            timezone = ("UTC -" + (minutes / 60) * (-1));
                        }

                        model = response.user;
                        context.$el.html(_.template(UsersPagesTemplate,
                            {
                                model          : model,
                                relatedEmployee: relatedEmployee.data,
                                timezone       : timezone
                            }));
                        common.canvasDraw({model: model}, this);

                        if (response.user.relatedEmployee) {
                            $("input[type='radio'][value=" + response.user.relatedEmployee._id + "]").attr("checked", true);
                        }
                        else {
                            $("input[type='radio']:first").attr("checked", true);
                        }
                        context.$el.append("<div id='timeRecivingDataFromServer'>Created in " + (new Date() - context.startTime) + " ms</div>");
                    }, this);
                }, this);

                return this;
            }
        });

        return ContentView;
    });
