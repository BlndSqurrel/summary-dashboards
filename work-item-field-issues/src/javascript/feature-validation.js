Ext.define('Rally.technicalservices.FeatureValidationRules',{
    extend: 'Rally.technicalservices.ValidationRules',

    requiredFields: undefined,

    constructor: function(config){
        Ext.apply(this, config);
        this.requiredFields = ['Owner','PlannedEndDate','PlannedStartDate','State','c_ValueMetricKPI','ValueScore'];

    },
    ruleFn_noStoriesForFeature: function(r){
        if (r.get('LeafStoryCount') == 0){
            return Ext.String.format('<li>Feature has no stories.')
        }
        return null;
    },
    ruleFn_FeatureHasNotBeenStarted: function(r){
        if (!r.get('ActualStartDate')){
            return Ext.String.format('<li>Feature has not been started.');
        }
        return null;
    },
    ruleFn_featureMissingFields: function(r) {
        var missingFields = [];

        _.each(this.requiredFields, function (f) {
            if (!r.get(f)) {
                var name = r.getField(f).displayName;
                missingFields.push(name);
            }
        });
        if (missingFields.length === 0) {
            return null;
        }
        return Ext.String.format('<li>Missing fields: {0}', missingFields.join(','));
    },
    ruleFn_FeatureHasNoParent: function(r) {
        if (!r.get('Parent')) {
            return Ext.String.format('<li>Feature has no parent.');
        }
        return null;
    }
});
