'use strict';

const { Router } = require('express');

const version = 1;

exports.router = config => {
    const router = Router();
    const { featureToggleStore } = config.stores;

    const featuresByUserFilter = (features, userId) =>
        features.map(feature => {
            const enabled = feature.strategies.some(stratergy => {
                // TODO: Need some null checks but 48hours.

                switch (stratergy.name) {
                    case 'default':
                        return feature.enabled;
                    case 'userWithId':
                        return (
                            feature.enabled &&
                            stratergy.parameters.userIds
                                .split(',')
                                .includes(userId)
                        );
                    default:
                        return false;
                }
            });

            return {
                name: feature.name,
                description: feature.description,
                enabled,
                devOnly: feature.devOnly,
            };
        });

    router.get('/:userId/features', (req, res) => {
        featureToggleStore.getFeatures().then(features =>
            res.json({
                version,
                features: featuresByUserFilter(features, req.params.userId),
            })
        );
    });

    return router;
};
