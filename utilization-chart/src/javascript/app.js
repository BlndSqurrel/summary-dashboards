Ext.define("utilization-chart", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'settings_box'},
        {xtype:'container',itemId:'selector_box'},
        {xtype:'container',itemId:'chart_box', margin: 5},
        {xtype:'container',itemId:'grid_box',  margin: 5},
        {xtype:'tsinfolink'}
    ],

    config: {
        defaultSettings: {
            zoomToIteration:  true
        }
    },
    
    launch: function() {
        
        if (this.isExternal()){
            this.showSettings(this.config);
        } else {
            this.onSettingsUpdate(this.getSettings());
        }
    },
    
    _launch: function(settings) {
        var me = this;
        
        this.logger.log("Settings:", settings);
        if ( settings.showScopeSelector == true || settings.showScopeSelector == "true" ) {
            this.down('#selector_box').add({
                xtype : 'timebox-selector',
                context : this.getContext(),
                listeners: {
                    releasechange: function(release){
                        this._changeRelease(release);
                    },
                    iterationchange: function(iteration){
                        this._changeIteration(iteration);
                    },
                    scope: this

                }
            });
        } else {
            this.subscribe(this, 'timeboxReleaseChanged', this._changeRelease, this);
            this.subscribe(this, 'timeboxIterationChanged', this._changeIteration, this);

            this.publish('requestTimebox', this);
        }
        
    },
    
    _changeRelease: function(release) {
//        var me = this;
//        var settings = this.getSettings();
//        this.logger.log("Release Changed:", release);
//        
//        if ( settings.zoomToIteration == false || settings.zoomToIteration == "false" ) {            
//            var name = release.get('Name');
//
//            var filter = [{property:'Name',value:name}];
//                        
//            me._loadAStoreWithAPromise('Release', ['ReleaseStartDate','ReleaseDate','Name'], filter ).then({
//                scope: me,
//                success: function(releases) {
//                    if (releases.length == 0) {
//                        me.down('#chart_box').add({ xtype:'container', html:'No releases in scope'});
//                    } else {
//                        me._gatherData(releases[0]);
//                    }
//                }
//            });
//                    
//        }
    },
    
    _changeIteration: function(iteration) {
        var me = this;
        var settings = this.getSettings();
        this.logger.log("Iteration changed:", iteration);
        
        if ( !Ext.isEmpty(iteration) && settings.zoomToIteration == true || settings.zoomToIteration == "true" ) {
            
            Rally.technicalservices.ModelBuilder.build('Iteration','Utilization',[]).then({
                scope: this,
                success: function(model){
                    var name = iteration.get('Name');
                    var filter = [{property:'Name',value: name}];
                    var fields = ['Name','Project','EndDate','StartDate','PlannedVelocity'];
                    
                    me._loadAStoreWithAPromise(model, fields, filter ).then({
                        scope: me,
                        success: function(iterations) {
                            console.log(iterations);
                        },
                        failure: function(msg) {
                            Ext.Msg.alert('!', msg);
                        }
                    });
                }
            });
        }
    },
    
    _loadAStoreWithAPromise: function(model, model_fields, filters){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        this.setLoading("Loading...");
        
        this.logger.log("Starting load:",model,model_fields, filters);
          
        Ext.create('Rally.data.wsapi.Store', {
            model: model,
            fetch: model_fields,
            filters: filters,
            limit: 'Infinity'
        }).load({
            callback : function(records, operation, successful) {
                me.setLoading(false);
                
                if (successful){
                    deferred.resolve(records);
                } else {
                    me.logger.log("Failed: ", operation);
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    },
    
     /********************************************
     /* Overrides for App class
     /*
     /********************************************/
    //getSettingsFields:  Override for App
    getSettingsFields: function() {
        var me = this;

        return [ 
            {
                name: 'showScopeSelector',
                xtype: 'rallycheckboxfield',
                boxLabelAlign: 'after',
                fieldLabel: '',
                margin: '0 0 25 200',
                boxLabel: 'Show Scope Selector<br/><span style="color:#999999;"><i>Tick to use this to broadcast settings.</i></span>'
            },
            {
                name: 'zoomToIteration',
                xtype: 'rallycheckboxfield',
                boxLabelAlign: 'after',
                fieldLabel: '',
                margin: '0 0 25 200',
                boxLabel: 'Show by Iteration<br/><span style="color:#999999;"><i>If <strong>not</strong> ticked, show by iterations in the selected release.</i></span>'
            }
        ];
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //showSettings:  Override
    showSettings: function(options) {
        this._appSettings = Ext.create('Rally.app.AppSettings', Ext.apply({
            fields: this.getSettingsFields(),
            settings: this.getSettings(),
            defaultSettings: this.getDefaultSettings(),
            context: this.getContext(),
            settingsScope: this.settingsScope,
            autoScroll: true
        }, options));

        this._appSettings.on('cancel', this._hideSettings, this);
        this._appSettings.on('save', this._onSettingsSaved, this);
        if (this.isExternal()){
            if (this.down('#settings_box').getComponent(this._appSettings.id)==undefined){
                this.down('#settings_box').add(this._appSettings);
            }
        } else {
            this.hide();
            this.up().add(this._appSettings);
        }
        return this._appSettings;
    },
    
    _onSettingsSaved: function(settings){
        Ext.apply(this.settings, settings);
        this._hideSettings();
        this.onSettingsUpdate(settings);
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this._launch(settings);
    }
});