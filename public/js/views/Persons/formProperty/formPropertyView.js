define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/Persons/formProperty/filterView',
    'text!templates/Persons/formProperty/formPropertyTemplate.html'
], function (Backbone, $, _, FilterView,  propertyTemplate) {
    var selectView = Backbone.View.extend({
        template       : _.template(propertyTemplate),

        events: {
            'click #addProperty'   : 'addProperty',
            'click #removeProperty': 'removeProperty',
            'click #saveBtn'       : 'saveChanges',
            'click #cancelBtn'     : 'cancelChanges'
        },

        addProperty: function () {
            new FilterView({
                model    : this.parentModel,
                attribute: this.attribute,
                saveDeal : this.saveDeal
            });
        },

        removeProperty: function () {
            var saveObject = {};
            this.model = '';

            saveObject[this.attribute] = null;
            this.saveDeal(saveObject, 'formProperty');
        },

        initialize: function (options) {
            this.type = options.type;
            this.attribute = options.attribute;
            this.parentModel = options.parentModel;
            this.responseObj = options.responseObj || [];
            this.saveDeal = options.saveDeal;
        },

        render: function () {
            var property = this.model ? this.model.toJSON() : '';

            this.$el.html(_.template(propertyTemplate, {property: property}));
            return this;
        }
    });

    return selectView;
});
